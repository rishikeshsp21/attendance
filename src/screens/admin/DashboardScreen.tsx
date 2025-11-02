import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { executeQuery } from '../../database/attendanceDB';
import XLSX from 'xlsx';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';import { Platform } from 'react-native';
import { PermissionsAndroid } from 'react-native';

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


type ViewKey = 'employees' | 'daily' | 'payroll';

interface Employee {
  employee_id: string;
  name: string;
  designation: string;
  role: string;
  default_sign_in_time?: string;
  default_sign_out_time?: string;
}

interface DailyReport {
  date: string;
  employee_id: string;
  sign_in_time?: string | null;
  sign_out_time?: string | null;
  total_hours?: number | null;
}

interface PayrollRecord {
  month: string;
  employee_id: string;
  hourly_wage?: number | null;
  total_hours?: number | null;
  amount?: number | null;
}

const ReportsScreen = () => {
  const [view, setView] = useState<ViewKey>('employees');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [daily, setDaily] = useState<DailyReport[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);

  useEffect(() => {
  const loadData = async () => {
    try {
      // Fetch data from SQLite tables
      const e = await executeQuery('SELECT * FROM employees');
      const d = await executeQuery('SELECT * FROM daily_reports');
      const p = await executeQuery('SELECT * FROM payroll');

      // Extract rows from query results
      const employeesData = [];
      const dailyData = [];
      const payrollData = [];

      for (let i = 0; i < e.rows.length; i++) {
        employeesData.push(e.rows.item(i));
      }
      for (let i = 0; i < d.rows.length; i++) {
        dailyData.push(d.rows.item(i));
      }
      for (let i = 0; i < p.rows.length; i++) {
        payrollData.push(p.rows.item(i));
      }

      // Update state
      setEmployees(employeesData);
      setDaily(dailyData);
      setPayroll(payrollData);
    } catch (err) {
      console.error('Error loading data from SQLite:', err);
    }
  };

  loadData();
}, []);

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

    // 1️⃣ Determine file name based on current view
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

    // 2️⃣ Ensure export folder exists
    const exportDir =
      Platform.OS === 'android'
        ? `${RNFS.DownloadDirectoryPath}/AttendanceApp`
        : `${RNFS.DocumentDirectoryPath}/AttendanceApp`;

    const dirExists = await RNFS.exists(exportDir);
    if (!dirExists) await RNFS.mkdir(exportDir);

    // 3️⃣ Generate file path with timestamp
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${baseName}_${dateStr}.xlsx`;
    const filePath = `${exportDir}/${fileName}`;

    // 4️⃣ Request Android storage permission
    if (Platform.OS === 'android') {
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Cannot save file without storage permission.');
        return;
      }
    }

    // 5️⃣ Convert data to Excel
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    const wbout = XLSX.write(wb, { type: 'binary', bookType: 'xlsx' });
    await RNFS.writeFile(filePath, wbout, 'ascii');

    // 6️⃣ Scan file (helps Files app index it on real devices)
    if (Platform.OS === 'android' && RNFS.scanFile) {
      await RNFS.scanFile(filePath).catch(() => {});
    }

    // 7️⃣ Notify user
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


const renderRow = ({ item }: any) => (
    <View style={styles.row}>
      {columns.map((c) => (
        <View key={c} style={styles.cell}>
          <Text style={styles.cellLabel}>{c}</Text>
          <Text style={styles.cellValue}>{String(item[c] ?? '')}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{title}</Text>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, view === 'employees' && styles.activeTab]}
          onPress={() => setView('employees')}
        >
          <Text
            style={[styles.tabText, view === 'employees' && styles.activeTabText]}
          >
            Employees
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, view === 'daily' && styles.activeTab]}
          onPress={() => setView('daily')}
        >
          <Text
            style={[styles.tabText, view === 'daily' && styles.activeTabText]}
          >
            Daily
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, view === 'payroll' && styles.activeTab]}
          onPress={() => setView('payroll')}
        >
          <Text
            style={[styles.tabText, view === 'payroll' && styles.activeTabText]}
          >
            Payroll
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {rows.length === 0 ? (
          <Text style={styles.noData}>No records found.</Text>
        ) : (
          <FlatList<any>
            data={rows}
            keyExtractor={(_, i) => i.toString()}
            renderItem={renderRow}
          />
        )}
      </ScrollView>

      <TouchableOpacity style={styles.exportButton} onPress={() => onExport(rows, view)}>
      <Text style={styles.exportText}>Export to Excel</Text>
      </TouchableOpacity>

    </View>
  );
};

export default ReportsScreen;

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
  content: {
    flex: 1,
    marginBottom: 16,
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
  },
  exportText: {
    color: '#fff',
    fontWeight: '600',
  },
});
