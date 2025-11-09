import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { executeQuery } from '../../database/attendanceDB';
import XLSX from 'xlsx';
import RNFS from 'react-native-fs';
import { Modal, TextInput, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
const [showSignInPicker, setShowSignInPicker] = useState(false);
  const [showSignOutPicker, setShowSignOutPicker] = useState(false);
const formatTime = (date: any) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };


type ViewKey = 'employees' | 'daily' | 'payroll';

interface Employee {
  employee_id: string;
  name: string;
  designation: string;
  role: string;
  default_sign_in_time?: string;
  default_sign_out_time?: string;
  hourly_wage?: number;
}

interface DailyReport {
  date: string;
  employee_id: string;
  actual_sign_in_time?: string | null;
  actual_sign_out_time?: string | null;
  daily_hours_worked?: number | null;
  overtime_hours?: number | null;
}

interface PayrollRecord {
  month: string;
  employee_id: string;
  hourly_wage?: number | null;
  total_hours_worked_for_month?: number | null;
  salary?: number | null;
}

async function requestStoragePermission() {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title: 'Storage Permission',
        message: 'App needs access to your storage to save reports',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn(err);
    return false;
  }
}


const DashboardScreen = () => {
  const [view, setView] = useState<ViewKey>('employees');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [daily, setDaily] = useState<DailyReport[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const e = await executeQuery('SELECT * FROM employees');
        const d = await executeQuery('SELECT * FROM daily_reports');
        const p = await executeQuery('SELECT * FROM payroll');

        const employeesData: Employee[] = [];
        const dailyData: DailyReport[] = [];
        const payrollData: PayrollRecord[] = [];

        for (let i = 0; i < e.rows.length; i++) employeesData.push(e.rows.item(i));
        for (let i = 0; i < d.rows.length; i++) dailyData.push(d.rows.item(i));
        for (let i = 0; i < p.rows.length; i++) payrollData.push(p.rows.item(i));

        setEmployees(employeesData);
        setDaily(dailyData);
        setPayroll(payrollData);
      } catch (err) {
        console.error('Error loading data from SQLite:', err);
      }
    };

    loadData();
  }, []);

  // Determine what data to show based on active tab
  const rows = useMemo(() => {
    if (view === 'employees') return employees;
    if (view === 'daily') return daily;
    return payroll;
  }, [view, employees, daily, payroll]);

  const columns = useMemo(() => {
    const r = rows[0];
    return r ? Object.keys(r) : [];
  }, [rows]);

  const title =
    view === 'employees'
      ? 'Employee Records'
      : view === 'daily'
      ? 'Daily Report'
      : 'Payroll';

  const onExport = async (rows: any[], view: string) => {
    try {
      if (!rows || rows.length === 0) {
        Alert.alert('No Data', 'There are no records to export.');
        return;
      }

      let baseName = 'report';
      switch (view) {
        case 'employees':
          baseName = 'employee_records';
          break;
        case 'daily':
          baseName = 'daily_report';
          break;
        case 'payroll':
          baseName = 'payroll_report';
          break;
      }

      const exportDir =
        Platform.OS === 'android'
          ? `${RNFS.DownloadDirectoryPath}/AttendanceApp`
          : `${RNFS.DocumentDirectoryPath}/AttendanceApp`;

      const dirExists = await RNFS.exists(exportDir);
      if (!dirExists) await RNFS.mkdir(exportDir);

      const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${baseName}_${dateStr}.xlsx`;
      const filePath = `${exportDir}/${fileName}`;

      if (Platform.OS === 'android') {
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) {
          Alert.alert('Permission Denied', 'Cannot save file without storage permission.');
          return;
        }
      }

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Report');
      const wbout = XLSX.write(wb, { type: 'binary', bookType: 'xlsx' });
      await RNFS.writeFile(filePath, wbout, 'ascii');

      if (Platform.OS === 'android' && RNFS.scanFile) {
        await RNFS.scanFile(filePath).catch(() => {});
      }

      Alert.alert(
        'File Saved Successfully',
        `Your Excel report has been saved to:\n${filePath}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export or save the file.');
    }
  };

const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
const [editVisible, setEditVisible] = useState(false);

const handleEdit = (employee: Employee) => {
  setSelectedEmployee(employee);
  setEditVisible(true);
};

const handleSaveEdit = async () => {
  if (!selectedEmployee) return;
  const {
    employee_id,
    name,
    designation,
    role,
    default_sign_in_time,
    default_sign_out_time,
    hourly_wage,
  } = selectedEmployee;

  try {
    await executeQuery(
      `UPDATE employees 
       SET name = ?, designation = ?, role = ?, default_sign_in_time = ?, 
           default_sign_out_time = ?, hourly_wage = ?
       WHERE employee_id = ?`,
      [
        name,
        designation,
        role,
        default_sign_in_time,
        default_sign_out_time,
        hourly_wage ?? 0,
        employee_id,
      ]
    );

    Alert.alert('Success', 'Employee updated successfully!');
    setEditVisible(false);

    // refresh list
    const e = await executeQuery('SELECT * FROM employees');
    const updated: Employee[] = [];
    for (let i = 0; i < e.rows.length; i++) updated.push(e.rows.item(i));
    setEmployees(updated);
  } catch (err) {
    console.error('Error updating employee:', err);
    Alert.alert('Error', 'Failed to update employee.');
  }
};

  const handleDelete = async (employeeId: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this employee?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await executeQuery(`DELETE FROM employees WHERE employee_id = ?`, [employeeId]);
            Alert.alert('Deleted', 'Employee removed successfully.');
            setEmployees((prev) => prev.filter((e) => e.employee_id !== employeeId));
          } catch (err) {
            console.error('Error deleting employee:', err);
            Alert.alert('Error', 'Failed to delete employee.');
          }
        },
      },
    ]);
  };

  const renderRow = ({ item }: any) => (
    <View style={styles.row}>
      {columns.map((c) => (
        <View key={c} style={styles.cell}>
          <Text style={styles.cellLabel}>{c}</Text>
          <Text style={styles.cellValue}>{String(item[c] ?? '')}</Text>
        </View>
      ))}

      {view === 'employees' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(item)}>
            <Text style={styles.buttonText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.employee_id)}>
            <Text style={styles.buttonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{title}</Text>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(['employees', 'daily', 'payroll'] as ViewKey[]).map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, view === key && styles.activeTab]}
            onPress={() => setView(key)}>
            <Text style={[styles.tabText, view === key && styles.activeTabText]}>
              {key.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Data */}
      {rows.length > 0 ? (
        <FlatList
          data={rows as any[]} // ✅ fixes TS union type issue
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderRow}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      ) : (
        <Text style={styles.noData}>No records found.</Text>
      )}

      {/* Export Button */}
      <TouchableOpacity style={styles.exportButton} onPress={() => onExport(rows, view)}>
        <Text style={styles.exportText}>Export to Excel</Text>
      </TouchableOpacity>

      {/* Edit Employee Modal */}
<Modal
  visible={editVisible}
  animationType="slide"
  transparent={true}
  onRequestClose={() => setEditVisible(false)}>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <Text style={styles.modalTitle}>Edit Employee</Text>
      <ScrollView>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={selectedEmployee?.name}
          onChangeText={(text) =>
            setSelectedEmployee((prev) => (prev ? { ...prev, name: text } : prev))
          }
          placeholder="Name"
        />

        <Text style={styles.label}>Designation</Text>
        <TextInput
          style={styles.input}
          value={selectedEmployee?.designation}
          onChangeText={(text) =>
            setSelectedEmployee((prev) => (prev ? { ...prev, designation: text } : prev))
          }
          placeholder="Designation"
        />

        <Text style={styles.label}>Role</Text>
        <View style={styles.pickerContainer}>
        <Text style={styles.label}>Select Role:</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={selectedEmployee?.role || 'Employee'}
            onValueChange={(itemValue) =>
              setSelectedEmployee((prev) => (prev ? { ...prev, role: itemValue } : prev))
            }
          >
            <Picker.Item label="Employee" value="Employee" />
            <Picker.Item label="Manager" value="Manager" />
            <Picker.Item label="Supervisor" value="Supervisor" />
          </Picker>
        </View>
      </View>

      <Text style={styles.label}>Sign in Time</Text> 
      <TextInput style={styles.input} 
      value={selectedEmployee?.default_sign_in_time} 
      onChangeText={(text) => setSelectedEmployee((prev) => (prev ? 
        { ...prev, default_sign_in_time: text } : prev)) } placeholder="Default Sign In Time (HH:mm)" 
        />

        <Text style={styles.label}>Sign out Time</Text> 
      <TextInput style={styles.input} 
      value={selectedEmployee?.default_sign_in_time} 
      onChangeText={(text) => setSelectedEmployee((prev) => (prev ? 
        { ...prev, default_sign_in_time: text } : prev)) } placeholder="Default Sign In Time (HH:mm)" 
        />
        <Text style={styles.label}>Hourly wage</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={selectedEmployee?.hourly_wage?.toString()}
          onChangeText={(text) =>
            setSelectedEmployee((prev) => (prev ? { ...prev, hourly_wage: parseFloat(text) || 0 } : prev))
          }
          placeholder="Hourly Wage"
        />
      </ScrollView>

      <View style={styles.modalButtons}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit}>
          <Text style={styles.modalButtonText}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setEditVisible(false)}>
          <Text style={styles.modalButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>


    </View>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef2f3',
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#ddd',
  },
  activeTab: {
    backgroundColor: '#007bff',
  },
  tabText: {
    color: '#333',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  row: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    padding: 12,
    elevation: 2,
  },
  cell: {
    marginBottom: 4,
  },
  cellLabel: {
    fontSize: 12,
    color: '#777',
  },
  cellValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
  },
  editButton: {
    backgroundColor: '#4CAF50',
    padding: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    padding: 6,
    borderRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noData: {
    textAlign: 'center',
    color: '#555',
    fontSize: 14,
    marginTop: 20,
  },
  exportButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  exportText: {
    color: '#fff',
    fontWeight: '600',
  },

  modalOverlay: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0,0,0,0.5)',
},
modalContainer: {
  backgroundColor: '#fff',
  width: '90%',
  borderRadius: 10,
  padding: 20,
  maxHeight: '85%',
},
modalTitle: {
  fontSize: 20,
  fontWeight: 'bold',
  marginBottom: 10,
  textAlign: 'center',
},
input: {
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 8,
  padding: 10,
  marginBottom: 10,
},
modalButtons: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  marginTop: 10,
},
saveButton: {
  backgroundColor: '#007bff',
  paddingVertical: 10,
  paddingHorizontal: 20,
  borderRadius: 8,
},
cancelButton: {
  backgroundColor: '#6c757d',
  paddingVertical: 10,
  paddingHorizontal: 20,
  borderRadius: 8,
},
modalButtonText: {
  color: '#fff',
  fontWeight: '600',
},
label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
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
});
