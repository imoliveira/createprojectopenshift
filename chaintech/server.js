const express = require('express');
const bodyParser = require('body-parser');
const mariadb = require('mariadb');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const PORT = 3000;

// --- Configuração da Aplicação ---

// Configura o EJS como o motor de visualização e o diretório de templates
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configuração da conexão com o banco de dados
const pool = mariadb.createPool({
    host: 'localhost',
    user: 'user_atividades',
    password: 'Ux6tqz01@',
    database: 'db_atividades',
    connectionLimit: 5
});

// Middleware para processar dados do formulário
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Servir arquivos estáticos (CSS, JS do front-end)
app.use(express.static(path.join(__dirname, 'public')));

// --- Definição das Rotas ---

// Rota para a página de login
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Rota de Login (POST)
app.post('/login', async (req, res) => {
    let conn;
    try {
        const { username, password } = req.body;
        conn = await pool.getConnection();

        const result = await conn.query("SELECT * FROM chaintech_users WHERE username = ?", [username]);

        if (result.length > 0) {
            const user = result[0];
            const match = await bcrypt.compare(password, user.password_hash);

            if (match) {
                // Login bem-sucedido, redireciona para a página de cadastro de atividades
                res.redirect('/formulario_atividades');
            } else {
                res.status(401).send('Usuário ou senha inválidos.');
            }
        } else {
            res.status(401).send('Usuário ou senha inválidos.');
        }
    } catch (err) {
        console.error("Erro na conexão ou query:", err);
        res.status(500).send('Erro interno do servidor.');
    } finally {
        if (conn) conn.release();
    }
});

// Rota para exibir o formulário de atividades usando EJS
app.get('/formulario_atividades', (req, res) => {
    res.render('formulario_atividades');
});

// Rota para processar o formulário e inserir na tabela tb_atividades
app.post('/atividades', async (req, res) => {
    let conn;
    try {
        const { data, nome, principais_realizacoes, projeto, detalhamento } = req.body;
        conn = await pool.getConnection();

        const sql = `
            INSERT INTO tb_atividades (Data, Nome, \`Principais Realizações\`, Projeto, Detalhamento)
            VALUES (?, ?, ?, ?, ?)
        `;
        const values = [data, nome, principais_realizacoes, projeto, detalhamento];
        await conn.query(sql, values);

        // Renderiza a página de sucesso, passando os dados inseridos
        res.render('success', { 
            atividade: { 
                data, 
                nome, 
                principais_realizacoes, 
                projeto, 
                detalhamento 
            }
        });
    } catch (err) {
        console.error("Erro ao inserir atividade:", err);
        res.status(500).send('Erro interno do servidor ao cadastrar atividade.');
    } finally {
        if (conn) conn.release();
    }
});

// --- Teste de Conexão e Inicialização do Servidor ---
async function startServer() {
    let conn;
    try {
        console.log('Tentando conectar ao banco de dados...');
        conn = await pool.getConnection();
        console.log('Conexão com o MariaDB bem-sucedida!');

        app.listen(PORT, () => {
            console.log(`Servidor rodando em http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Erro fatal: Não foi possível conectar ao banco de dados.');
        console.error('Verifique as credenciais, o estado do servidor do banco de dados e as permissões.');
        console.error(err);
        process.exit(1);
    } finally {
        if (conn) conn.release();
    }
}

startServer();

