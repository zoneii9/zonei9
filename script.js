// ===============================================================
// ==           INSTALLATION WORK REPORT - FRONTEND             ==
// ===============================================================

// 🔴 วาง URL ของเว็บแอปที่คุณคัดลอกมา ที่นี่
const SCRIPT_URL = 'YOUR_WEB_APP_URL_HERE'; 

// --- DOM Elements ---
const form = document.getElementById('reportForm');
const submitButton = document.getElementById('submitButton');
const buttonText = document.querySelector('#submitButton .button-text');
const loader = document.querySelector('#submitButton .loader');
const reportContainer = document.getElementById('reportContainer');

// --- Functions ---

/**
 * ฟังก์ชันแปลงไฟล์เป็น Base64 เพื่อส่งไปที่ Apps Script
 * @param {File} file - The file to convert.
 * @returns {Promise<string>} - A promise that resolves with the base64 string.
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

/**
 * ฟังก์ชันแสดง Preview รูปภาพที่ผู้ใช้เลือก
 * @param {string} inputId - The ID of the file input element.
 * @param {string} previewId - The ID of the img element for preview.
 */
function setupImagePreview(inputId, previewId) {
    document.getElementById(inputId).addEventListener('change', function() {
        const file = this.files[0];
        const preview = document.getElementById(previewId);
        if (file) {
            preview.style.display = 'block';
            preview.src = URL.createObjectURL(file);
        } else {
            preview.style.display = 'none';
            preview.src = '#';
        }
    });
}

/**
 * ฟังก์ชันโหลดและแสดงผลรายงานจาก Google Sheet
 */
async function loadReportData() {
    reportContainer.innerHTML = `<div class="loading-data">กำลังโหลดข้อมูล...</div>`;
    try {
        const response = await fetch(SCRIPT_URL); // ใช้ GET request โดยปริยาย
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();

        if (result.status === 'success') {
            if (result.data.length === 0) {
                 reportContainer.innerHTML = `<p>ยังไม่มีข้อมูลรายงาน</p>`;
                 return;
            }

            let tableHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>ลำดับ</th>
                            <th>วันที่</th>
                            <th>Section</th>
                            <th>รายละเอียด (เช้า)</th>
                            <th>รูป (เช้า)</th>
                            <th>รายละเอียด (บ่าย)</th>
                            <th>รูป (บ่าย)</th>
                            <th>หมายเหตุ</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            // แสดงผลจากใหม่ไปเก่า (reverse the array)
            result.data.reverse().forEach(row => {
                // ดึงข้อมูลโดยใช้ชื่อคอลัมน์จาก Sheet เป็น Key
                const reportDate = row['วันที่'] ? new Date(row['วันที่']).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric'}) : 'N/A';
                
                tableHTML += `
                    <tr>
                        <td>${row['no.'] || ''}</td>
                        <td>${reportDate}</td>
                        <td>
                           <b>${row['Section Title'] || ''}</b><br>
                           <small>${row['部分标题 (中文)'] || ''}</small>
                        </td>
                        <td>
                           ${row['Description (早晨)'] || ''}<br>
                           <small>${row['描述 (早晨)'] || ''}</small>
                        </td>
                        <td>${row['Image (早晨)'] ? `<a href="${row['Image (早晨)']}" target="_blank"><img src="${row['Image (早晨)']}" alt="Morning Image"></a>` : '-'}</td>
                        <td>
                           ${row['Description (下午)'] || ''}<br>
                           <small>${row['描述 (下午)'] || ''}</small>
                        </td>
                        <td>${row['Image (下午)'] ? `<a href="${row['Image (下午)']}" target="_blank"><img src="${row['Image (下午)']}" alt="Afternoon Image"></a>` : '-'}</td>
                        <td>${row['Remarks / 备注'] || ''}</td>
                    </tr>
                `;
            });
            tableHTML += `</tbody></table>`;
            reportContainer.innerHTML = tableHTML;
        } else {
            reportContainer.innerHTML = `<p class="error">เกิดข้อผิดพลาดในการโหลดข้อมูล: ${result.message}</p>`;
        }
    } catch (error) {
        console.error('Connection Error:', error);
        reportContainer.innerHTML = `<p class="error">เกิดข้อผิดพลาดในการเชื่อมต่อ: ${error.message}</p>`;
    }
}

// --- Event Listeners ---

/**
 * จัดการการส่งฟอร์ม (Submit Event)
 */
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // แสดงสถานะกำลังโหลด
    submitButton.disabled = true;
    buttonText.style.display = 'none';
    loader.style.display = 'inline-block';

    try {
        // จัดการไฟล์รูปภาพ
        const fileMorning = document.getElementById('imageMorning').files[0];
        const fileAfternoon = document.getElementById('imageAfternoon').files[0];

        const [base64Morning, base64Afternoon] = await Promise.all([
            fileMorning ? fileToBase64(fileMorning) : Promise.resolve(null),
            fileAfternoon ? fileToBase64(fileAfternoon) : Promise.resolve(null)
        ]);

        // รวบรวมข้อมูลจากฟอร์ม
        const formData = {
            sectionTitleEN: document.getElementById('sectionTitleEN').value,
            sectionTitleCN: document.getElementById('sectionTitleCN').value,
            descMorningEN: document.getElementById('descMorningEN').value,
            descMorningCN: document.getElementById('descMorningCN').value,
            descAfternoonEN: document.getElementById('descAfternoonEN').value,
            descAfternoonCN: document.getElementById('descAfternoonCN').value,
            remarks: document.getElementById('remarks').value,
            imageBase64Morning: base64Morning,
            fileNameMorning: fileMorning ? fileMorning.name : '',
            imageBase64Afternoon: base64Afternoon,
            fileNameAfternoon: fileAfternoon ? fileAfternoon.name : ''
        };

        // ส่งข้อมูลไปยัง Google Apps Script
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(formData),
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', // ใช้ text/plain เพื่อหลีกเลี่ยง CORS preflight
            },
        });

        const result = await response.json();
        
        if (result.status === 'success') {
            alert('บันทึกข้อมูลสำเร็จ!');
            form.reset();
            // ซ่อน Preview หลังจากรีเซ็ตฟอร์ม
            document.querySelectorAll('.image-preview').forEach(img => {
                img.style.display = 'none';
                img.src = '#';
            });
            loadReportData(); // โหลดข้อมูลใหม่เพื่อแสดงผลทันที
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        alert('เกิดข้อผิดพลาดในการบันทึก: ' + error.message);
    } finally {
        // คืนค่าปุ่มกลับเป็นปกติ
        submitButton.disabled = false;
        buttonText.style.display = 'inline';
        loader.style.display = 'none';
    }
});

/**
 * เมื่อหน้าเว็บโหลดเสร็จ ให้เริ่มทำงาน
 */
document.addEventListener('DOMContentLoaded', () => {
    setupImagePreview('imageMorning', 'previewMorning');
    setupImagePreview('imageAfternoon', 'previewAfternoon');
    loadReportData();
});
