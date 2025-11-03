import SQLite from 'react-native-sqlite-2';

// Open or create the local database
const db = SQLite.openDatabase('attendance.db', '1.0', 'Attendance Management Database', 200000);

// ✅ Initialize all tables
export const initializeDatabase = () => {
  db.transaction((tx) => {
    // tx.executeSql('DROP TABLE IF EXISTS employees'); 
    // console.log("removed old daily employees table");
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS employees (
        employee_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        designation TEXT NOT NULL,
        role TEXT NOT NULL,
        face_embeddings TEXT,
        default_sign_in_time TEXT,
        default_sign_out_time TEXT,
        hourly_wage REAL DEFAULT 0,
        total_hours_worked_for_month REAL DEFAULT 0
      );`,
      [],
      () => console.log('✅ Employees table ready'),
      (_, error) => console.error('❌ Error creating employees table:', error)
    );

    // tx.executeSql('DROP TABLE IF EXISTS daily_reports'); 
    // console.log("removed old daily reports table");
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS daily_reports (
        employee_id TEXT,
        name TEXT,
        default_sign_in_time TEXT,
        actual_sign_in_time TEXT,
        default_sign_out_time TEXT,
        actual_sign_out_time TEXT,
        daily_hours_worked REAL DEFAULT 0,
        overtime_hours REAL DEFAULT 0,
        date TEXT
      );`,
      [],
      () => console.log('✅ Daily reports table ready'),
      (_, error) => console.error('❌ Error creating daily_reports table:', error)
    );

    // tx.executeSql('DROP TABLE IF EXISTS payroll'); 
    // console.log("removed old daily payroll table");
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS payroll (
        employee_id TEXT,
        name TEXT,
        total_hours_worked_for_month REAL,
        hourly_wage REAL,
        salary REAL,
        month TEXT
      );`,
      [],
      () => console.log('✅ Payroll table ready'),
      (_, error) => console.error('❌ Error creating payroll table:', error)
    );
  });
};

// ✅ Promise-based query helper (works with async/await)
export const executeQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        query,
        params,
        (_, results) => resolve(results),
        (_, error) => {
          console.error('❌ SQL error:', error);
          reject(error);
        }
      );
    });
  });
};

// ✅ Close database
export const closeDatabase = () => {
  db.close(
    () => console.log('🛑 Database closed successfully'),
    (error) => console.error('❌ Error closing database:', error)
  );
};

export default db;
