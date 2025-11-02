import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { executeQuery } from '../../database/attendanceDB';

const LoginScreen = ({ navigation }: any) => {
  const [employeeId, setEmployeeId] = useState('');
  const [signedIn, setSignedIn] = useState(false);
  const [verifying, setVerifying] = useState(false);

  function toISOTimeString() {
  const now = new Date();
  return now.toISOString().split('T')[1].split('.')[0]; // HH:mm:ss (24-hour)
  }
  const handleSignInOut = async () => {
  // 🔹 Helper: get ISO 24-hour time string (HH:mm:ss)
  const toISOTimeString = () => {
    const now = new Date();
    return now.toISOString().split('T')[1].split('.')[0];
  };

  // 🔹 Helper: normalize stored times (handles legacy AM/PM or 24hr)
  const normalizeTimeString = (timeStr: string | null) => {
    if (!timeStr) return null;
    if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) return timeStr; // already good

    const parsed = new Date(`1970-01-01T${timeStr}`);
    if (isNaN(parsed.getTime())) return null; // ✅ fix
    return parsed.toISOString().split('T')[1].split('.')[0];

  };

  if (!employeeId.trim()) {
    Alert.alert('Employee ID required', 'Please enter your Employee ID.');
    return;
  }

  try {
    // 1️⃣ Verify employee
    const employeeResult = await executeQuery(
      'SELECT * FROM employees WHERE employee_id = ?',
      [employeeId]
    );

    if (employeeResult.rows.length === 0) {
      Alert.alert('Employee not registered', 'Please register before signing in.');
      return;
    }

    const employee = employeeResult.rows.item(0);
    const currentDate = new Date().toLocaleDateString('en-CA'); 
    const currentTime = new Date().toLocaleTimeString('en-GB', {
  hour12: false,
  timeZone: 'Asia/Kolkata',
});


    // 2️⃣ Check today's record
    const existingReport = await executeQuery(
      'SELECT * FROM daily_reports WHERE employee_id = ? AND date = ?',
      [employeeId, currentDate]
    );

    // 🌟 CASE 1: No record → new sign-in
    if (existingReport.rows.length === 0) {
      await executeQuery(
        `INSERT INTO daily_reports 
         (employee_id, name, default_sign_in_time, actual_sign_in_time,
          default_sign_out_time, actual_sign_out_time, daily_hours_worked,
          overtime_hours, date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          employee.employee_id,
          employee.name,
          employee.default_sign_in_time,
          currentTime,
          employee.default_sign_out_time,
          null,
          0,
          0,
          currentDate,
        ]
      );

      setSignedIn(true);
      Alert.alert('Signed In', `Welcome, ${employee.name}!`);
      setEmployeeId('');
      return;
    }

    const report = existingReport.rows.item(0);
    const hasSignedIn = !!report.actual_sign_in_time;
    const hasSignedOut = !!report.actual_sign_out_time;

    // 🌟 CASE 2: Manager / Supervisor special flow
    if (employee.role === 'Manager' || employee.role === 'Supervisor') {
      if (hasSignedIn && !hasSignedOut) {
        Alert.alert(
          'Already Signed In',
          'Would you like to:',
          [
            {
              text: 'Sign Out',
              onPress: async () => {
                try {
                  const signInRaw = normalizeTimeString(report.actual_sign_in_time);
                  const signOutRaw = currentTime;

                  let hoursWorked = 0;
                  let overtime = 0;

                  if (signInRaw && signOutRaw) {
                    const signInTime = new Date(`${currentDate}T${signInRaw}`);
                    const signOutTime = new Date(`${currentDate}T${signOutRaw}`);

                    if (
                      !isNaN(signInTime.getTime()) &&
                      !isNaN(signOutTime.getTime()) &&
                      signOutTime > signInTime
                    ) {
                      const diffMs = signOutTime.getTime() - signInTime.getTime();
                      const diffHours = diffMs / (1000 * 60 * 60);
                      hoursWorked = Number(diffHours.toFixed(2));
                      overtime = Number(Math.max(0, diffHours - 8).toFixed(2));
                    }
                  }

                  hoursWorked = Number.isFinite(hoursWorked) ? hoursWorked : 0;
                  overtime = Number.isFinite(overtime) ? overtime : 0;

                  await executeQuery(
                    `UPDATE daily_reports
                     SET actual_sign_out_time = ?, daily_hours_worked = ?, overtime_hours = ?
                     WHERE employee_id = ? AND date = ?`,
                    [signOutRaw, hoursWorked, overtime, employeeId, currentDate]
                  );

                  setSignedIn(false);
                  Alert.alert('Signed Out', `You have signed out successfully, ${employee.name}`);
                } catch (err) {
                  console.error('Sign-out error:', err);
                  Alert.alert('Error', 'Something went wrong during sign out.');
                }
              },
            },
            {
              text: 'View Dashboard',
              onPress: () => navigation.navigate('Dashboard'),
            },
            { text: 'Cancel', style: 'cancel' },
          ],
          { cancelable: true }
        );
        return;
      }

      if (hasSignedOut) {
        Alert.alert(
          'Signed Out',
          'You have already signed out. View dashboard?',
          [
            { text: 'Yes', onPress: () => navigation.navigate('Dashboard') },
            { text: 'No', style: 'cancel' },
          ]
        );
        setEmployeeId('');
        return;
      }
    }

    // 🌟 CASE 3: Regular employee or fallback logic
    if (hasSignedIn && !hasSignedOut) {
      const signInRaw = normalizeTimeString(report.actual_sign_in_time);
      const signOutRaw = currentTime;

      let hoursWorked = 0;
      let overtime = 0;

      if (signInRaw && signOutRaw) {
        const signInTime = new Date(`${currentDate}T${signInRaw}`);
        const signOutTime = new Date(`${currentDate}T${signOutRaw}`);

        if (
          !isNaN(signInTime.getTime()) &&
          !isNaN(signOutTime.getTime()) &&
          signOutTime > signInTime
        ) {
          const diffMs = signOutTime.getTime() - signInTime.getTime();
          const diffHours = diffMs / (1000 * 60 * 60);
          hoursWorked = Number(diffHours.toFixed(2));
          overtime = Number(Math.max(0, diffHours - 8).toFixed(2));
        }
      }

      hoursWorked = Number.isFinite(hoursWorked) ? hoursWorked : 0;
      overtime = Number.isFinite(overtime) ? overtime : 0;

      await executeQuery(
        `UPDATE daily_reports
         SET actual_sign_out_time = ?, daily_hours_worked = ?, overtime_hours = ?
         WHERE employee_id = ? AND date = ?`,
        [signOutRaw, hoursWorked, overtime, employeeId, currentDate]
      );

      setSignedIn(false);
      Alert.alert('Signed Out', 'You have been signed out successfully.');
    } else if (hasSignedOut) {
      Alert.alert('Already Signed Out', 'You have already signed out for today.');
    } else {
      Alert.alert(
        'Already Signed In',
        'You have already signed in today. Please sign out before signing in again.'
      );
    }

    setEmployeeId('');
  } catch (error) {
    console.error('Sign In/Out Error:', error);
    Alert.alert('Error', 'An error occurred during sign-in/out.');
  }
};

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Employee Access</Text>

        <Text style={styles.label}>Employee ID</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your employee ID"
          value={employeeId}
          onChangeText={setEmployeeId}
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSignInOut}>
            <Text style={styles.primaryButtonText}>Sign In / Out</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.secondaryButtonText}>Register</Text>
          </TouchableOpacity>
        </View>

        {verifying && (
          <Text style={styles.note}>Face verification required (coming soon)</Text>
        )}

        {signedIn && (
          <Text style={styles.note}>
            Currently signed in as <Text style={{ fontWeight: 'bold' }}>{employeeId}</Text>
          </Text>
        )}
      </View>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef2f3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    width: '90%',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  primaryButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  primaryButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#007bff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  note: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
    color: '#444',
  },
});