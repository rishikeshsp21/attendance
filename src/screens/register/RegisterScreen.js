import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { executeQuery } from '../../database/attendanceDB';

const RegisterScreen = ({ navigation }) => {
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [role, setRole] = useState('Employee');
  const [signInTime, setSignInTime] = useState('');
  const [signOutTime, setSignOutTime] = useState('');
  const [showSignInPicker, setShowSignInPicker] = useState(false);
  const [showSignOutPicker, setShowSignOutPicker] = useState(false);
  const [hourlyWage, setHourlyWage] = useState('');

  const handleRegister = async () => {
  if (!employeeId || !name || !designation || !role) {
    Alert.alert('Missing Info', 'Please fill all required fields.');
    return;
  }

  try {
    await executeQuery(
  `INSERT INTO employees 
   (employee_id, name, designation, role, default_sign_in_time, default_sign_out_time, hourly_wage)
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
  [employeeId, name, designation, role, signInTime, signOutTime, parseFloat(hourlyWage) || 0]
);
const month = new Date().toISOString().slice(0, 7); // YYYY-MM
await executeQuery(
  `INSERT INTO payroll 
   (employee_id, name, month, total_hours_worked_for_month, hourly_wage, salary)
   VALUES (?, ?, ?, ?, ?, ?)`,
  [employeeId, name, month, 0, parseFloat(hourlyWage) || 0, 0]
);
    Alert.alert('Success', `${name} has been registered successfully!`);
    navigation.navigate('Login');
  } catch (error) {
    console.error('Registration Error:', error);

    // Handle unique constraint violation
    if (
      error.message &&
      (error.message.includes('UNIQUE constraint failed') ||
        error.message.includes('constraint failed'))
    ) {
      Alert.alert(
        'Duplicate Employee ID',
        'An employee with this ID already exists. Please use a different ID.'
      );
    } else {
      Alert.alert('Error', 'Failed to register employee. Please try again.');
    }
  }
};


  // Format time as HH:MM (24-hour)
  const formatTime = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Register Employee</Text>

      <Text style={styles.label}>Employee ID</Text>
      <TextInput
        style={styles.input}
        placeholder="Employee ID"
        value={employeeId}
        onChangeText={setEmployeeId}
      />

      <Text style={styles.label}>Full Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Designation</Text>
      <TextInput
        style={styles.input}
        placeholder="Designation"
        value={designation}
        onChangeText={setDesignation}
      />

      {/* Role Picker */}
      <View style={styles.pickerContainer}>
        <Text style={styles.label}>Select Role:</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={role}
            onValueChange={(itemValue) => setRole(itemValue)}
          >
            <Picker.Item label="Employee" value="Employee" />
            <Picker.Item label="Manager" value="Manager" />
            <Picker.Item label="Supervisor" value="Supervisor" />
          </Picker>
        </View>
      </View>

      {/* Time Pickers */}
      <Text style={styles.label}>Default Sign-In Time</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowSignInPicker(true)}
      >
        <Text>
          {signInTime ? `Default Sign-In Time: ${signInTime}` : 'Select Default Sign-In Time'}
        </Text>
      </TouchableOpacity>

      {showSignInPicker && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowSignInPicker(false);
            if (selectedDate) setSignInTime(formatTime(selectedDate));
          }}
        />
      )}

      <Text style={styles.label}>Default Sign-Out Time</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowSignOutPicker(true)}
      >
        <Text>
          {signOutTime ? `Default Sign-Out Time: ${signOutTime}` : 'Select Default Sign-Out Time'}
        </Text>
      </TouchableOpacity>

      {showSignOutPicker && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowSignOutPicker(false);
            if (selectedDate) setSignOutTime(formatTime(selectedDate));
          }}
        />
        
      )}
      <Text style={styles.label}>Hourly wage</Text>
      <TextInput
        style={styles.input}
        placeholder="Hourly wage"
        value={hourlyWage}
        onChangeText={setHourlyWage}
        keyboardType="numeric"  // ✅ limits input to numbers
      />

      {/* Buttons */}
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.cancelButton]}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.buttonText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  pickerContainer: {
    marginBottom: 15,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
});
