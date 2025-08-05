const bcrypt = require('bcrypt');

const passwordToHash = 'Ux6tqz01@'; // Mude para a senha que você quer usar
const saltRounds = 10;

bcrypt.hash(passwordToHash, saltRounds, (err, hash) => {
    if (err) {
        console.error(err);
    } else {
        console.log('O hash da sua senha é:');
        console.log(hash);
    }
});

