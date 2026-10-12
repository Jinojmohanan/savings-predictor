document.addEventListener('DOMContentLoaded', () => {
    const districts = [
        "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore",
        "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram",
        "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai",
        "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai",
        "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi",
        "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli",
        "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur",
        "Vellore", "Viluppuram", "Virudhunagar"
    ];

    const mealPrices = {
        'chicken_gravy': 270,
        'mutton_gravy': 375,
        'paneer_dish': 230,
        'chicken_biryani': 240,
        'mutton_biryani': 350,
        'idly': 48,
        'plain_dosa': 70,
        'masala_dosa': 110,
        'veg_meals': 140
    };

    // Fuel auto-assigned: Bike = Petrol (₹108.5, avg 45 km/l), Car = Diesel (₹100.5, avg 15 km/l)
    const vehicleDefaults = {
        'bike':  { fuelPrice: 108.5, mileage: 45 },
        'car':   { fuelPrice: 100.5, mileage: 15 }
    };

    // Average monthly km estimate
    const AVG_MONTHLY_KM = 500;

    // DOM Elements
    const districtSelect      = document.getElementById('district');
    const eatOutsideSelect    = document.getElementById('eatOutsideTimes');
    const moviesSelect        = document.getElementById('moviesPerMonth');
    const salaryInput         = document.getElementById('salary');
    const rentInput           = document.getElementById('houseRent');
    const surveyForm          = document.getElementById('surveyForm');
    const resultsSection      = document.getElementById('resultsSection');
    const cookingRadios       = document.querySelectorAll('input[name="cookingHabit"]');
    const eatOutsideSection   = document.getElementById('eatOutsideSection');
    const teetotallerRadios   = document.querySelectorAll('input[name="teetotaller"]');
    const smokeSection        = document.getElementById('smokeSection');

    // Populate Dropdowns
    districts.forEach(district => {
        const option = document.createElement('option');
        option.value = district.toLowerCase();
        option.textContent = district;
        districtSelect.appendChild(option);
    });

    for (let i = 1; i <= 31; i++) {
        eatOutsideSelect.add(new Option(i, i));
        moviesSelect.add(new Option(i, i));
    }

    // --- Conditional Visibility ---

    cookingRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            // Show the "eat outside" section only when "outside" is selected
            if (radio.value === 'outside') {
                eatOutsideSection.classList.remove('hidden');
                eatOutsideSelect.value = "30";
            } else {
                eatOutsideSection.classList.add('hidden');
                eatOutsideSelect.value = "0";
            }
        });
    });

    teetotallerRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'no') {
                smokeSection.classList.remove('hidden');
            } else {
                smokeSection.classList.add('hidden');
                // clear any previously selected smoke option when hidden
                const checkedSmoke = surveyForm.querySelector('input[name="smoke"]:checked');
                if (checkedSmoke) checkedSmoke.checked = false;
            }
        });
    });

    // --- Validation ---
    const validateInt = (el) => {
        const val = el.value.trim();
        const isValid = /^\d+$/.test(val);
        el.classList.toggle('invalid', !isValid);
        return isValid;
    };

    [salaryInput, rentInput].forEach(el => {
        el.addEventListener('input', () => validateInt(el));
    });

    // --- Calculation & Submission ---
    surveyForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Validate text inputs
        const salaryOk = validateInt(salaryInput);
        const rentOk   = validateInt(rentInput);

        // Validate required radio groups
        const requiredRadios = ['cookingHabit', 'diet', 'teetotaller', 'transport'];
        let radiosOk = true;
        requiredRadios.forEach(name => {
            const group = surveyForm.querySelectorAll(`input[name="${name}"]`);
            const checked = [...group].some(r => r.checked);
            group.forEach(r => r.closest('.radio-group').style.outline = checked ? '' : '2px solid #ff4d4d');
            if (!checked) radiosOk = false;
        });

        if (!salaryOk || !rentOk || !radiosOk) {
            // Scroll to first error
            const firstError = surveyForm.querySelector('.invalid, [style*="outline"]');
            if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        // Clear any radio error highlights
        surveyForm.querySelectorAll('.radio-group').forEach(g => g.style.outline = '');

        const salary      = parseInt(salaryInput.value);
        const rent        = parseInt(rentInput.value);
        const movieTimes  = parseInt(moviesSelect.value) || 0;

        const foodExpense  = 0; // meal type removed per user request
        const movieExpense = movieTimes * 200;

        // Smoking expense: only if non-teetotaller AND smoker
        // Avg: 12 packs × ₹400 (avg of ₹350–450) + 10 beers × ₹165 (avg of ₹150–180)
        const isTeetotaller = document.querySelector('input[name="teetotaller"]:checked')?.value;
        const isSmoker      = document.querySelector('input[name="smoke"]:checked')?.value;
        let smokingExpense = 0;
        if (isTeetotaller === 'no' && isSmoker === 'yes') {
            const cigaretteCost = 12 * 400;   // 12 packs/month avg × ₹400
            const beerCost      = 10 * 165;   // 10 bottles/month avg × ₹165
            smokingExpense = cigaretteCost + beerCost; // ₹4,800 + ₹1,650 = ₹6,450
        }

        // Transport: auto petrol for bike, diesel for car
        let transportExpense = 0;
        const selectedTransport = document.querySelector('input[name="transport"]:checked');
        if (selectedTransport && vehicleDefaults[selectedTransport.value]) {
            const { fuelPrice, mileage } = vehicleDefaults[selectedTransport.value];
            transportExpense = (AVG_MONTHLY_KM / mileage) * fuelPrice;
        }

        const totalExpenses = rent + foodExpense + movieExpense + transportExpense + smokingExpense;
        const savings = salary - totalExpenses;

        displayResults(savings, rent, foodExpense, movieExpense, transportExpense, smokingExpense, totalExpenses);
    });

    function displayResults(savings, rent, food, movies, transport, smoking, total) {
        // Transition to results page
        surveyForm.classList.add('hidden');
        resultsSection.classList.remove('hidden');
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

        document.getElementById('predictedSavings').textContent = Math.round(savings).toLocaleString('en-IN');
        document.getElementById('breakdownRent').textContent      = '₹' + rent.toLocaleString('en-IN');
        document.getElementById('breakdownFood').textContent      = '₹' + Math.round(food).toLocaleString('en-IN');
        document.getElementById('breakdownMovies').textContent    = '₹' + movies.toLocaleString('en-IN');
        document.getElementById('breakdownTransport').textContent = '₹' + Math.round(transport).toLocaleString('en-IN');
        document.getElementById('breakdownTotal').textContent     = '₹' + Math.round(total).toLocaleString('en-IN');

        // Smoking row: show only if applicable
        const smokingRow = document.getElementById('smokingRow');
        if (smoking > 0) {
            smokingRow.style.display = 'flex';
            document.getElementById('breakdownSmoking').textContent = '₹' + smoking.toLocaleString('en-IN');
        } else {
            smokingRow.style.display = 'none';
        }

        // Color savings green/red
        const savingsEl = document.getElementById('predictedSavings');
        savingsEl.style.color = savings >= 0 ? '#00f2ff' : '#ff4d4d';

        let conclusion = "";
        if (savings > 20000)
            conclusion = "🎉 Excellent! You have very strong savings. You're on track for financial freedom!";
        else if (savings > 10000)
            conclusion = "✅ Great job! You are saving a healthy amount each month. Keep optimizing!";
        else if (savings > 5000)
            conclusion = "👍 Good effort. Some room to reduce discretionary spending.";
        else if (savings > 0)
            conclusion = "⚠️ You're barely saving. Consider cutting down on eating out or opting for public transport.";
        else
            conclusion = "🚨 Warning! Your expenses exceed your income. Immediate budget review is needed.";

        document.getElementById('overallConclusion').textContent = conclusion;
    }

    document.getElementById('restartBtn').addEventListener('click', () => {
        resultsSection.classList.add('hidden');
        surveyForm.classList.remove('hidden');
        surveyForm.reset();
        [eatOutsideSection, smokeSection].forEach(s => s.classList.add('hidden'));
        // reset result fields to defaults
        document.getElementById('predictedSavings').textContent = '0';
        document.getElementById('breakdownRent').textContent = '₹0';
        document.getElementById('breakdownFood').textContent = '₹0';
        document.getElementById('breakdownMovies').textContent = '₹0';
        document.getElementById('breakdownTransport').textContent = '₹0';
        document.getElementById('breakdownTotal').textContent = '₹0';
        document.getElementById('breakdownSmoking').textContent = '₹0';
    });
});
