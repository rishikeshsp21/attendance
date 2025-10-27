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
import AsyncStorage from '@react-native-async-storage/async-storage';

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
        const e = await AsyncStorage.getItem('employees');
        const d = await AsyncStorage.getItem('dailyReports');
        const p = await AsyncStorage.getItem('payroll');
        if (e) setEmployees(JSON.parse(e));
        if (d) setDaily(JSON.parse(d));
        if (p) setPayroll(JSON.parse(p));
      } catch (err) {
        console.error('Error loading data:', err);
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

  const onExport = () => {
    Alert.alert('Export Feature', 'Export to Excel is not yet implemented.');
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

      <TouchableOpacity style={styles.exportButton} onPress={onExport}>
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
