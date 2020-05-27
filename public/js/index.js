const loginForm = document.getElementById('login-form');
document.getElementById('email-field').style.display = 'none';

document.addEventListener('input',(e)=>{
    if(e.target.getAttribute('name')=="sigReg")
    console.log(e.target.value)
        if (e.target.value == 'register'){
            document.getElementById('email-field').style.display = 'block';
        } else{
          document.getElementById('email-field').style.display = 'none';
        }
    })
// Message submit
loginForm.addEventListener('submit', e => {
    e.preventDefault();

    const inputs = e.target.elements;
    if (inputs.sigReg.value && (inputs.email.value || inputs.sigReg.value == 'signIn') && inputs.username.value && inputs.password.value){
        const signReg = async () => {
            if (inputs.sigReg.value == 'signIn'){
                const response = await fetch('http://localhost:3000/api/login', {
                    method: 'POST',
                    body: JSON.stringify({
                      'username': inputs.username.value,
                      'password': inputs.password.value
                    }), // string or object
                    headers: {
                      'Accept': 'application/json',
                      'Content-Type': 'application/json'
                    }
                  });
                  const myJson = await response.json(); 
                  if (response.status == 200){
                    console.log(myJson);
                    localStorage.setItem('user', JSON.stringify(myJson));
                    window.location = "http://localhost:3000/chat.html";return;
                  }
            } else{ 
                const response = await fetch('http://localhost:3000/api/register', {
                  method: 'POST',
                  body: JSON.stringify({
                    'username': inputs.username.value,
                    'email': inputs.email.value,
                    'password': inputs.password.value
                  }), // string or object
                  headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                  }
                });
                const myJson = await response.json(); //extract JSON from the http response
                // do something with myJson
            }
          }
          signReg();
    }
    // Emit message to server
  
    // socket.emit('chatMessage', msg);
  
    // // Clear input
    // e.target.elements.msg.value = '';
    // e.target.elements.msg.focus();
  });