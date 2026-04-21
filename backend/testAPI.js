const runTest = async () => {
    try {
        console.log('Registering test user...');
        const email = `testuser_${Date.now()}@test.com`;
        
        const regRes = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Temp',
                email,
                password: 'password123'
            })
        });
        
        const regData = await regRes.json();
        if (!regRes.ok) throw new Error(regData.message || 'Register failed');
        
        const token = regData.token;
        console.log('Registered. Token received.');
        
        console.log('Updating profile...');
        const putRes = await fetch('http://localhost:5000/api/auth/profile', {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({
                studentId: 'IT999999',
                examYear: '2028',
                institute: 'SLIIT'
            })
        });
        
        const putData = await putRes.json();
        if (!putRes.ok) throw new Error(putData.message || 'Update failed');
        
        console.log('Update successful! Result:', putData.studentId, putData.examYear);
    } catch (error) {
        console.error('Error occurred:', error);
    }
};

runTest();
