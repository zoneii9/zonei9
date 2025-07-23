// ===============================================================
// ==           INSTALLATION WORK REPORT - FRONTEND             ==
// ==                  VERSION 2 - DEBUG READY                  ==
// ===============================================================

// 🔴 วาง URL ของเว็บแอปที่คุณคัดลอกมา ที่นี่
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyFSCwfQ4gB_RJIg_g-DtHCaiF3Xi_E4LlDf2TSCA2uysf5yQhNIEGGTN9PbyMhBwHKkQ/exec'; 

// --- DOM Elements ---
const form = document.getElementById('reportForm');
const submitButton = document.getElementById('submitButton');
const buttonText = document.querySelector('#submitButton .button-text');
const loader = document.querySelector('#submitButton .loader');
const reportContainer = document.getElementById('reportContainer');

// --- Functions ---

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

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
 * ฟังก์ชันโหลดและแสดงผลรายงานจาก Google Sheet (เวอร์ชันปรับปรุง)
 */
async function loadReportData() {
    reportContainer.innerHTML = `<div class="loading-data">กำลังโหลดข้อมูล...</div>`;
    try {
        const response = await fetch(SCRIPT_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const result = await response.json();

        // --- DEBUGGING ---
        // บรรทัดนี้สำคัญมาก! มันจะแสดงข้อมูลดิบที่ได้รับจาก Backend ใน Console
        console.log("Data received from Google Apps Script:", result);
        // -----------------

        if (result.status === 'success') {
            if (!result.data || result.data.length === 0) {
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
            
            result.data.reverse().forEach(row => {
                // สร้าง object ใหม่ที่ key ถูก trim() เพื่อตัดช่องว่างที่ไม่จำเป็นออก
                const cleanRow = {};
                for (const key in row) {
                    cleanRow[key.trim()] = row[key];
                }

                const reportDate = cleanRow['วันที่'] ? new Date(cleanRow['วันที่']).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric'}) : 'N/A';
                
                tableHTML += `
                    <tr>
                        <td>${cleanRow['no.'] || ''}</td>
                        <td>${reportDate}</td>
                        <td>
                           <b>${cleanRow['Section Title'] || ''}</b><br>
                           <small>${cleanRow['部分标题 (中文)'] || ''}</small>
                        </td>
                        <td>
                           ${cleanRow['Description (早晨)'] || ''}<br>
                           <small>${cleanRow['描述 (早晨)'] || ''}</small>
                        </td>
                        <td>${cleanRow['Image (早晨)'] ? `<a href="${cleanRow['Image (早晨)']}" target="_blank"><img src="${cleanRow['Image (早晨)']}" alt="Morning Image"></a>` : '-'}</td>
                        <td>
                           ${cleanRow['Description (下午)'] || ''}<br>
                           <small>${cleanRow['描述 (下午)'] || ''}</small>
                        </td>
                        <td>${cleanRow['Image (下午)'] ? `<a href="${cleanRow['Image (下午)']}" target="_blank"><img src="${cleanRow['Image (下午)']}" alt="Afternoon Image"></a>` : '-'}</td>
                        <td>${cleanRow['Remarks / 备注'] || ''}</td>
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
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitButton.disabled = true;
    buttonText.style.display = 'none';
    loader.style.display = 'inline-block';

    try {
        const fileMorning = document.getElementById('imageMorning').files[0];
        const fileAfternoon = document.getElementById('imageAfternoon').files[0];
        const [base64Morning, base64Afternoon] = await Promise.all([
            fileMorning ? fileToBase64(fileMorning) : Promise.resolve(null),
            fileAfternoon ? fileToBase64(fileAfternoon) : Promise.resolve(null)
        ]);
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
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(formData),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        });
        const result = await response.json();
        if (result.status === 'success') {
            alert('บันทึกข้อมูลสำเร็จ!');
            form.reset();
            document.querySelectorAll('.image-preview').forEach(img => {
                img.style.display = 'none';
                img.src = '#';
            });
            loadReportData();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        alert('เกิดข้อผิดพลาดในการบันทึก: ' + error.message);
    } finally {
        submitButton.disabled = false;
        buttonText.style.display = 'inline';
        loader.style.display = 'none';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    setupImagePreview('imageMorning', 'previewMorning');
    setupImagePreview('imageAfternoon', 'previewAfternoon');
    loadReportData();
});

