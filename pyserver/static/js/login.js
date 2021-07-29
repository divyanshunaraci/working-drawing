const loginForm = document.getElementById("login-form");
const loginButton = document.getElementById("login-form-submit");

loginButton.addEventListener("click", (e) => {
    e.preventDefault();
    const username = loginForm.username.value;
    const password = loginForm.password.value;
    console.log(username, 'username', password, 'password');
    let data = {
        "email": loginForm.username.value,
        "password": loginForm.password.value
    }
    fetch('http://15.206.209.192:8080/api/user/login', {
        method: 'POST',
        body: JSON.stringify(data), // The data
        headers: {
            'Content-type': 'application/json' // The type of data you're sending
        }
    }).then(function (response) {
        console.log(response)
        if (response.ok) {
            return response.json();
        }
        return Promise.reject(response);
    }).then(function (data) {
        localStorage.setItem('token', data.token)
        userId = data.user['_id']
        localStorage.setItem('userId', data.user['_id'])
        localStorage.setItem('orgId',data.user['orgId']['_id'])
        location.pathname = "static/wdPdf.html"
        console.log(data);
    }).catch(function (error) {
        console.warn('Something went wrong.', error);
    });
})

// module.exports = {userId} ;
