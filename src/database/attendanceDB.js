import SQLite from 'react-native-sqlite-2';

// Open or create the local database
const db = SQLite.openDatabase('attendance.db', '1.0', 'Attendance Management Database', 200000);

/**
 * Initialize all tables
 * - employees: stores employee details and wage info
 * - daily_reports: tracks daily attendance
 * - payroll: stores monthly salary summary
 */
export const initializeDatabase = () => {
  db.transaction((tx) => {
    // --- Employees Table ---
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS employees (
        employee_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        designation TEXT NOT NULL,
        role TEXT NOT NULL,
        face_embeddings TEXT,
        default_sign_in_time TEXT,
        default_sign_out_time TEXT,
        hourly_wage REAL,
        total_hours_worked_for_month REAL DEFAULT 0
      );`,
      [],
      () => console.log('✅ Employees table ready'),
      (_, error) => console.error('❌ Error creating employees table:', error)
    );

    // --- Daily Reports Table ---
    tx.executeSql('DROP TABLE IF EXISTS daily_reports');
    console.log("removed old daily reports table");
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS daily_reports (
        employee_id TEXT,
        name TEXT,
        default_sign_in_time TEXT,
        actual_sign_in_time TEXT,
        default_sign_out_time TEXT,
        actual_sign_out_time TEXT,
        overtime REAL DEFAULT 0,
        date TEXT
      );`,
      [],
      () => console.log('✅ Daily reports table ready'),
      (_, error) => console.error('❌ Error creating daily_reports table:', error)
    );

    // --- Payroll Table ---
    tx.executeSql('DROP TABLE IF EXISTS payroll');
    console.log("removed old daily payroll table");
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS payroll (
        employee_id TEXT,
        name TEXT,
        phone_number TEXT,
        email_address TEXT,
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

/**
 * Helper function to run raw queries easily
 * @param {string} query SQL query string
 * @param {array} params Query parameters (optional)
 * @param {function} successCallback Called with results
 * @param {function} errorCallback Called on error
 */
export const executeQuery = (query, params = [], successCallback, errorCallback) => {
  db.transaction((tx) => {
    tx.executeSql(
      query,
      params,
      (_, results) => {
        if (successCallback) successCallback(results);
      },
      (_, error) => {
        console.error('❌ SQL error:', error);
        if (errorCallback) errorCallback(error);
      }
    );
  });
};

/**
 * Close the database connection
 */
export const closeDatabase = () => {
  db.close(() => {
    console.log('🛑 Database closed successfully');
  }, (error) => {
    console.error('❌ Error closing database:', error);
  });
};

// Export the db object for direct use if needed
export default db;