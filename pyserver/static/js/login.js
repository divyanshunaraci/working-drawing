const loginForm = document.getElementById("login-form");
const loginButton = document.getElementById("login-form-submit");
const loginErrorMsg = document.getElementById("login-error-msg");
​
​
loginButton.addEventListener("click", (e) => {
    e.preventDefault();
    const username = loginForm.username.value;
    const password = loginForm.password.value;
    let data = {
        "email": loginForm.username.value,
        "password": loginForm.password.value
    }
​
    console.log(username, 'username', password, 'password');
    
    fetch('http://15.207.19.54:8080/api/user/login', {
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
        location.href= "static/wdPdf.html"
        console.log(data);
    }).catch(function (error) {
        console.warn('Something went wrong.', error);
    });
})
function loginFun() {
    console.log('lokjiu');
}
// document.getElementById("login-form-submit").onclick=function (e) {
//     location.href="https://www.youtube.com/"
//     console.log('llllll');
​
// };