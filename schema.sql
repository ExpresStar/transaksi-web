-- Create Database
CREATE DATABASE IF NOT EXISTS admin_dashboard;
USE admin_dashboard;

-- Drop table if exists
DROP TABLE IF EXISTS transactions;

-- Create transactions table
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_no VARCHAR(50) NOT NULL,
    recharge_no VARCHAR(50) NOT NULL,
    receiver_name VARCHAR(100) NOT NULL,
    card_number VARCHAR(50) NOT NULL,
    bank_name ENUM('VCB', 'AGRI', 'TBC', 'MB', 'BIDV', 'VPB', 'TCB') NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    allow_transfer_time DATETIME NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_time DATETIME NULL,
    admin_note TEXT
);

-- Insert some dummy data simulating the Chinese UI
INSERT INTO transactions (order_no, recharge_no, receiver_name, card_number, bank_name, amount, created_at, allow_transfer_time, status)
VALUES 
('9454022568382815232', '857342057025519618', 'TRAN THANH TIEN', '171120030000', 'MB', 1000000, '2026-02-21 19:31:15', '2026-02-21 20:02:20', 'pending'),
('945402301747724288', '857342057025519617', 'TRAN QUANG PHUC', '0376436371', 'BIDV', 500000, '2026-02-21 19:31:15', '2026-02-21 20:02:40', 'pending'),
('945402456916008768', '857342246088274944', 'TRAN TRUNG HIEU', '0862071947', 'MB', 100000, '2026-02-21 19:32:00', '2026-02-21 20:02:52', 'pending'),
('945402405407119360', '857342182854639617', 'LE VAN THAI', '232039798066', 'MB', 6000000, '2026-02-21 19:31:45', '2026-02-28 09:47:00', 'pending'), -- This one might be pending based on current time
('945402464625131520', '857342246088274946', 'HOANG VAN AI', '0908884187', 'MB', 170000, '2026-02-21 19:32:00', '2026-02-28 09:55:00', 'pending'), -- Future time for testing yellow button enable
('945402664613077248', '857342434542239745', 'NGUYEN DUC DOAN', '0871004250193', 'VCB', 600000, '2026-02-21 19:32:45', '2026-02-21 20:03:36', 'approved'), -- Already approved
('945402438364654176', '857342246088274945', 'NGUYEN THI TRINH', '0908288773', 'MB', 400000, '2026-02-21 19:32:00', '2026-02-21 20:04:09', 'rejected'); -- Already rejected
