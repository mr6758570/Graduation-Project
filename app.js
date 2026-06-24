// ==========================================
// نظام إدارة المخازن المتكامل - ملف: app.js
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    // تحديد نوع الصفحة الحالية بناءً على العناصر الفريدة المتواجدة بها
    const isDashboardPage = !!document.getElementById("tableBody");

    if (isDashboardPage) {
        initDashboard();
    }
});

// ==========================================
// 1. منطق عمل لوحة التحكم وإدارة المخزون
// ==========================================
function initDashboard() {
    // جلب عناصر الإدخال والتحكم عبر التحديد المباشر لضمان الاستقرار
    const productInput = document.getElementById("productInput") || document.querySelectorAll(".form-grid input")[0];
    const codeInput = document.getElementById("codeInput") || document.querySelectorAll(".form-grid input")[1];
    const dateInput = document.getElementById("dateInput") || document.querySelectorAll(".form-grid input")[2];
    const unitSelect = document.getElementById("unitSelect") || document.querySelector(".form-grid select");
    const productImgUrlInput = document.getElementById("productImgUrlInput"); // ميزة جلب حقل مسار الصورة المضافة

    const addBtn = document.querySelector(".add-btn");
    const editBtn = document.querySelector(".edit-btn");
    const deleteBtn = document.querySelector(".delete-btn");
    const searchBtn = document.querySelector(".search-btn");
    const tableBody = document.getElementById("tableBody");

    // حقول وقوائم الوارد
    const supplierSelect = document.getElementById("supplierSelect");
    const inPrice = document.querySelectorAll(".stock-box")[0].querySelectorAll("input")[0];
    const inQty = document.querySelectorAll(".stock-box")[0].querySelectorAll("input")[1];
    const inTotal = document.querySelectorAll(".stock-box")[0].querySelectorAll("input")[2];

    // حقول وقوائم الصادر
    const customerSelect = document.getElementById("customerSelect");
    const outPrice = document.querySelectorAll(".stock-box")[1].querySelectorAll("input")[0];
    const outQty = document.querySelectorAll(".stock-box")[1].querySelectorAll("input")[1];
    const outTotal = document.querySelectorAll(".stock-box")[1].querySelectorAll("input")[2];

    // تحميل البيانات من الـ LocalStorage
    let stocks = JSON.parse(localStorage.getItem("stocks")) || [];
    let selectedIndex = null;

    // ==========================================
    // دالة جلب العملاء والموردين وتحديث قوائم الاختيار
    // ==========================================
    function populateContactSelects() {
        const contacts = JSON.parse(localStorage.getItem("appContacts")) || [];
        
        if (supplierSelect) {
            supplierSelect.innerHTML = '<option value="">-- اختر مورد --</option>';
            contacts.filter(c => c.type === 'supplier').forEach(sup => {
                supplierSelect.innerHTML += `<option value="${sup.name}">${sup.name}</option>`;
            });
        }
        
        if (customerSelect) {
            customerSelect.innerHTML = '<option value="">-- اختر عميل --</option>';
            contacts.filter(c => c.type === 'customer').forEach(cust => {
                customerSelect.innerHTML += `<option value="${cust.name}">${cust.name}</option>`;
            });
        }
    }

    // حفظ البيانات
    function saveData() {
        localStorage.setItem("stocks", JSON.stringify(stocks));
    }

    // حساب الإجماليات تلقائياً
    function calcInTotal() {
        inTotal.value = Number(inPrice.value) * Number(inQty.value) || 0;
    }

    // حساب إجماليات الصادر تلقائياً
    function calcOutTotal() {
        outTotal.value = Number(outPrice.value) * Number(outQty.value) || 0;
    }

    // ربط أحداث الحساب التلقائي بالمدخلات
    inPrice.addEventListener("input", calcInTotal);
    inQty.addEventListener("input", calcInTotal);
    outPrice.addEventListener("input", calcOutTotal);
    outQty.addEventListener("input", calcOutTotal);

    // ==========================================
    // عرض جدول حركات المخزن
    // ==========================================
    function renderTable(data = stocks) {
        tableBody.innerHTML = "";

        data.forEach((item, index) => {
            const row = document.createElement("tr");

            let supplierLabel = "";
            let customerLabel = "";

            if (Number(item.inQty) > 0 && item.supplierName) {
                supplierLabel = `<br><small style="color: #10b981; font-weight: 600;">(مورد: ${item.supplierName})</small>`;
            }
            if (Number(item.outQty) > 0 && item.customerName) {
                customerLabel = `<br><small style="color: #3b82f6; font-weight: 600;">(عميل: ${item.customerName})</small>`;
            }

            // تحديد الصورة الحالية أو الافتراضية للجدول
            const currentImg = item.imgUrl ? item.imgUrl : "https://placehold.co/50x50/e2e8f0/475569?text=📦";

            row.innerHTML = `
                <td><img src="${currentImg}" class="table-prod-img" onerror="this.src='https://placehold.co/50x50/e2e8f0/475569?text=📦'"></td>
                <td>${item.product}</td>
                <td>${item.code}</td>
                <td>${item.unit}</td>
                <td style="color: #10b981; font-weight: bold;">${item.inQty} ${supplierLabel}</td>
                <td style="color: #ef4444; font-weight: bold;">${item.outQty} ${customerLabel}</td>
                <td>${item.date}</td>
            `;

            // عند الضغط على صف في الجدول لتعديله أو حذفه
            row.addEventListener("click", () => {
                document.querySelectorAll("tr").forEach(r => r.classList.remove("selected"));
                row.classList.add("selected");

                selectedIndex = index;

                productInput.value = item.product;
                codeInput.value = item.code;
                unitSelect.value = item.unit;
                dateInput.value = item.date;
                if (productImgUrlInput) productImgUrlInput.value = item.imgUrl || "";

                inQty.value = item.inQty;
                outQty.value = item.outQty;

                if (supplierSelect) supplierSelect.value = item.supplierName || "";
                if (customerSelect) customerSelect.value = item.customerName || "";

                calcInTotal();
                calcOutTotal();
            });

            tableBody.appendChild(row);
        });

        updateCards();
        updateCharts();
    }

    // ==========================================
    // إضافة حركة جديدة
    // ==========================================
    addBtn.addEventListener("click", () => {
        if (!productInput.value || !codeInput.value) {
            alert("أدخل البيانات الأساسية للمنتج أولاً");
            return;
        }

        const chosenDate = dateInput.value || new Date().toISOString().split('T')[0];
        const currentSupplier = (Number(inQty.value) > 0 && supplierSelect) ? supplierSelect.value : "";
        const currentCustomer = (Number(outQty.value) > 0 && customerSelect) ? customerSelect.value : "";
        const currentImgUrl = productImgUrlInput ? productImgUrlInput.value.trim() : "";

        const newItem = {
            product: productInput.value,
            code: codeInput.value,
            unit: unitSelect.value,
            inQty: Number(inQty.value) || 0,
            outQty: Number(outQty.value) || 0,
            date: chosenDate,
            supplierName: currentSupplier,
            customerName: currentCustomer,
            imgUrl: currentImgUrl // حفظ رابط الصورة
        };

        stocks.push(newItem);

        saveData();
        renderTable();
        clearForm();
        checkLowStock();
    });

    // ==========================================
    // تعديل حركة مخزنية
    // ==========================================
    editBtn.addEventListener("click", () => {
        if (selectedIndex === null) {
            alert("اختر صفاً من الجدول للتعديل عليه أولاً");
            return;
        }

        const chosenDate = dateInput.value || stocks[selectedIndex].date;
        const currentSupplier = (Number(inQty.value) > 0 && supplierSelect) ? supplierSelect.value : "";
        const currentCustomer = (Number(outQty.value) > 0 && customerSelect) ? customerSelect.value : "";
        const currentImgUrl = productImgUrlInput ? productImgUrlInput.value.trim() : stocks[selectedIndex].imgUrl;

        stocks[selectedIndex] = {
            product: productInput.value,
            code: codeInput.value,
            unit: unitSelect.value,
            inQty: Number(inQty.value) || 0,
            outQty: Number(outQty.value) || 0,
            date: chosenDate,
            supplierName: currentSupplier,
            customerName: currentCustomer,
            imgUrl: currentImgUrl // تعديل وحفظ رابط الصورة الجديد
        };

        saveData();
        renderTable();
        clearForm();

        selectedIndex = null;
        checkLowStock();
    });

    // ==========================================
    // حذف حركة مخزنية
    // ==========================================
    deleteBtn.addEventListener("click", () => {
        if (selectedIndex === null) {
            alert("اختر صفاً للحذف");
            return;
        }

        stocks.splice(selectedIndex, 1);

        saveData();
        renderTable();
        clearForm();

        selectedIndex = null;
    });

    // ==========================================
    // البحث المتقدم
    // ==========================================
    searchBtn.addEventListener("click", () => {
        const keyword = prompt("ابحث بالكود، اسم المنتج، المورد، أو العميل:");

        if (!keyword) {
            renderTable();
            return;
        }

        const result = stocks.filter(item =>
            item.product.includes(keyword) ||
            item.code.includes(keyword) ||
            (item.supplierName && item.supplierName.includes(keyword)) ||
            (item.customerName && item.customerName.includes(keyword))
        );

        renderTable(result);
    });

    // ==========================================
    // تفريغ وتصفير الحقول
    // ==========================================
    function clearForm() {
        productInput.value = "";
        codeInput.value = "";
        dateInput.value = "";
        if (productImgUrlInput) productImgUrlInput.value = "";

        inPrice.value = "";
        inQty.value = "";
        inTotal.value = "";

        outPrice.value = "";
        outQty.value = "";
        outTotal.value = "";

        if (supplierSelect) supplierSelect.value = "";
        if (customerSelect) customerSelect.value = "";
    }

    // ==========================================
    // تحديث كروت الإحصائيات (Dashboard Cards)
    // ==========================================
    function updateCards() {
        const uniqueProducts = new Set(stocks.map(s => s.code));

        const totalIn = stocks.reduce((sum, item) => sum + Number(item.inQty), 0);
        const totalOut = stocks.reduce((sum, item) => sum + Number(item.outQty), 0);

        const cards = document.querySelectorAll(".card h2");

        if (cards.length >= 4) {
            cards[0].textContent = uniqueProducts.size;
            cards[1].textContent = totalIn;            
            cards[2].textContent = totalOut;           
            cards[3].textContent = totalIn - totalOut; 
        }
    }

    // ==========================================
    // إدارة الرسوم البيانية (Charts)
    // ==========================================
    const incomeCtx = document.getElementById("incomeChart");
    const outcomeCtx = document.getElementById("outcomeChart");
    let incomeChart, outcomeChart;

    if (incomeCtx && outcomeCtx) {
        incomeChart = new Chart(incomeCtx, {
            type: "bar",
            data: {
                labels: [],
                datasets: [{
                    label: "الوارد",
                    data: [],
                    backgroundColor: "#22c55e"
                }]
            },
            options: { responsive: true }
        });

        outcomeChart = new Chart(outcomeCtx, {
            type: "line",
            data: {
                labels: [],
                datasets: [{
                    label: "الصادر",
                    data: [],
                    borderColor: "#ef4444",
                    fill: false
                }]
            },
            options: { responsive: true }
        });
    }

    function updateCharts() {
        if (!incomeChart || !outcomeChart) return;

        const labels = stocks.map(s => s.product);
        const inData = stocks.map(s => Number(s.inQty));
        const outData = stocks.map(s => Number(s.outQty));

        incomeChart.data.labels = labels;
        incomeChart.data.datasets[0].data = inData;
        incomeChart.update();

        outcomeChart.data.labels = labels;
        outcomeChart.data.datasets[0].data = outData;
        outcomeChart.update();
    }

    // ==========================================
    // دالة فحص وتحذير رصيد المخزون الحرج
    // ==========================================
    function checkLowStock() {
        const productBalances = {};

        stocks.forEach(item => {
            if (!productBalances[item.product]) {
                productBalances[item.product] = { in: 0, out: 0 };
            }
            productBalances[item.product].in += Number(item.inQty || 0);
            productBalances[item.product].out += Number(item.outQty || 0);
        });

        let warningMessage = "";

        for (const prodName in productBalances) {
            const netStock = productBalances[prodName].in - productBalances[prodName].out;
            
            if (netStock <= 5 && netStock >= 0) {
                warningMessage += `⚠️ المنتج [ ${prodName} ] قارب على النفاد! المتبقي: (${netStock}) فقط.\n`;
            }
        }

        if (warningMessage !== "") {
            alert("🚨 تنبيهات المخزون الحرجة:\n\n" + warningMessage);
        }
    }

    populateContactSelects();
    renderTable();
    checkLowStock();
}