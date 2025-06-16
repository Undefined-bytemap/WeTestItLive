// Script for Auto Report page

function updateAutoReport() {
    const reportInfo = window.reportInfo;
    console.log('Report Info:', reportInfo);

    if (!reportInfo || !reportInfo.parameters) {
        console.error('No report information found');
        return;
    }

    const params = reportInfo.parameters.split('-');
    console.log('Parsed parameters:', params);

    // Map URL parameters to checkbox IDs
    const checkboxMap = {
        'C': 'cameraTest',
        'M': 'microphoneTest',
        'B': 'batteryTest'
    };

    // Iterate over the parameters and check corresponding boxes
    params.forEach(param => {
        console.log(`Checking parameter: ${param}`);
        if (checkboxMap[param]) {
            const checkbox = document.getElementById(checkboxMap[param]);
            if (checkbox) {
                checkbox.checked = true;
                console.log(`Checkbox updated: ${checkboxMap[param]}`);
            } else {
                console.log(`Checkbox not found: ${checkboxMap[param]}`);
            }
        }
    });

    // Handle battery stress level dropdown
    const batteryStressLevelDropdown = document.getElementById('batteryStressLevel');
    if (params.includes('BC')) {
        batteryStressLevelDropdown.value = 'cpu';
        console.log('Battery stress level set to CPU');
    } else if (params.includes('BCG')) {
        batteryStressLevelDropdown.value = 'cpu-gpu';
        console.log('Battery stress level set to CPU + GPU');
    } else {
        batteryStressLevelDropdown.value = 'none';
        console.log('Battery stress level set to None');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateAutoReport);
} else {
    updateAutoReport();
}
