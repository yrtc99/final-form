import sqlite3
import os
import glob

def view_database():
    # First, check current directory and list files
    print("Current directory:", os.getcwd())
    print("\nFiles in current directory:")
    for file in glob.glob("*.*"):
        print(f"  - {file} ({os.path.getsize(file)} bytes)")
    
    # Look for database files
    db_files = glob.glob("*.db")
    print(f"\nFound {len(db_files)} database files:")
    for db in db_files:
        print(f"  - {db} ({os.path.getsize(db)} bytes)")
    
    # 修改為指向instance目錄中的數據庫文件
    instance_db_path = os.path.join('..', 'instance', 'python_learning.db')
    if os.path.exists(instance_db_path):
        db_path = instance_db_path
        print(f"Using database in instance directory: {db_path}")
    else:
        db_path = 'python_learning.db'
        print(f"Using local database: {db_path}")
        
    if not os.path.exists(db_path):
        print(f"ERROR: Database file '{db_path}' not found!")
        return
        
    # Connect to database
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        print(f"\nSuccessfully connected to database: {db_path}")
    except Exception as e:
        print(f"ERROR connecting to database: {e}")
        return

    try:
        # 獲取所有表名
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        if not tables:
            print("數據庫中沒有表")
            return
            
        print(f"\n找到 {len(tables)} 個表:")
        for i, table in enumerate(tables):
            print(f"  {i+1}. {table[0]}")
            
        # 顯示每個表的內容
        for table in tables:
            table_name = table[0]
            print(f"\n===== 表: {table_name} =====")
            
            # 獲取表結構
            cursor.execute(f"PRAGMA table_info({table_name});")
            columns = cursor.fetchall()
            column_names = [f"{col[1]}({col[2]})" for col in columns]
            print(f"列: {', '.join(column_names)}")
            
            # 獲取記錄數
            cursor.execute(f"SELECT COUNT(*) FROM {table_name};")
            count = cursor.fetchone()[0]
            print(f"記錄數: {count}")
            
            # 獲取數據
            if count > 0:
                cursor.execute(f"SELECT * FROM {table_name} LIMIT 10;")
                rows = cursor.fetchall()
                print("\n數據預覽:")
                for i, row in enumerate(rows):
                    print(f"  記錄 {i+1}: {row}")
                if count > 10:
                    print(f"  ...還有 {count - 10} 條記錄")
    except Exception as e:
        print(f"查詢數據庫時出錯: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    view_database()
