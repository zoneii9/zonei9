// 🔴 วาง URL ของเว็บแอปที่คุณคัดลอกมา ที่นี่
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyFSCwfQ4gB_RJIg_g-DtHCaiF3Xi_E4LlDf2TSCA2uysf5yQhNIEGGTN9PbyMhBwHKkQ/exec'; 

// DOM Elements
const form = document.getElementById('reportForm');
const submitButton = document.getElementById('submitButton');
const buttonText = document.querySelector('#submitButton .button-text');
const loader = document.querySelector('#submitButton .loader');
const reportContainer = document.getElementById('reportContainer');

// --- Functions ---

// ฟังก์ชันแปลงไฟล์เป็น Base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// ฟังก์ชันแสดง Preview รูป
function setupImagePreview(inputId, previewId) {
    document.getElementById(inputId).addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const preview = document.getElementById(previewId);
            preview.style.display = 'block';
            preview.src = URL.createObjectURL(file);
        }
    });
}

// ฟังก์ชันโหลดและแสดงผลรายงาน
async function loadReportData() {
    try {
        const response = await fetch(SCRIPT_URL);
        const result = await response.json();

        if (result.status === 'success') {
            let tableHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Section</th>
                            <th>Morning Description</th>
                            <th>Morning Image</th>
                            <th>Afternoon Description</th>
                            <th>Afternoon Image</th>
                            <th>Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            // แสดงผลจากใหม่ไปเก่า
            result.data.reverse().forEach(row => {
                tableHTML += `
                    <tr>
                        <td>${row.Remarks ? new Date(row.Remarks).toLocaleDateString('th-TH') : ''}</td>
                        <td>
                           <b>${row.SectionTitle || ''}</b><br>
                           <small>${row. || ''}</small>
                        </td>
                        <td>
                           ${row.Description || ''}<br>
                           <small>${row. || ''}</small>
                        </td>
                        <td>${row.imageUrlMorning ? `<a href="${row.imageUrlMorning}" target="_blank"><img src="${row.imageUrlMorning}" alt="Morning Image"></a>` : ''}</td>
                        <td>
                           ${row.Description1 || ''}<br>
                           <small>${row.1 || ''}</small>
                        </td>
                        <td>${row.imageUrlAfternoon ? `<a href="${row.imageUrlAfternoon}" target="_blank"><img src="${row.imageUrlAfternoon}" alt="Afternoon Image"></a>` : ''}</td>
                        <td>${row.Remarks || ''}</td>
                    </tr>
                `;
            });
            tableHTML += `</tbody></table>`;
            reportContainer.innerHTML = tableHTML;
        } else {
            reportContainer.innerHTML = `<p>Error loading data: ${result.message}</p>`;
        }
    } catch (error) {
        reportContainer.innerHTML = `<p>Error connecting to the server.</p>`;
    }
}


// --- Event Listeners ---

// จัดการการส่งฟอร์ม
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // แสดงสถานะกำลังโหลด
    submitButton.disabled = true;
    buttonText.style.display = 'none';
    loader.style.display = 'block';

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
            document.querySelectorAll('.image-preview').forEach(img => img.style.display = 'none');
            loadReportData(); // โหลดข้อมูลใหม่
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
        // คืนค่าปุ่มกลับเป็นปกติ
        submitButton.disabled = false;
        buttonText.style.display = 'inline';
        loader.style.display = 'none';
    }
});


// เมื่อหน้าเว็บโหลดเสร็จ
document.addEventListener('DOMContentLoaded', () => {
    setupImagePreview('imageMorning', 'previewMorning');
    setupImagePreview('imageAfternoon', 'previewAfternoon');
    loadReportData();
});
