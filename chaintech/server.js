const express = require('express');
const bodyParser = require('body-parser');
const mariadb = require('mariadb');
const bcrypt = require('bcrypt');
const path = require('path');
const ExcelJS = require('exceljs');

const app = express();
const PORT = 3000;


require('dotenv').config();

// --- Configuração da Aplicação ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  connectionLimit: 5
});


app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Rotas ---

// Página de Login
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Login
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

// Formulário + Lista de Atividades (EJS)
app.get('/formulario_atividades', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
 //       const atividades = await conn.query("SELECT * FROM tb_atividades ORDER BY Data DESC");
	  const atividades = await conn.query("SELECT * FROM tb_atividades ORDER BY Data DESC LIMIT 7");
        res.render('formulario_atividades', { atividades });
    } catch (err) {
        console.error("Erro ao buscar atividades:", err);
        res.status(500).send('Erro ao carregar página de atividades.');
    } finally {
        if (conn) conn.release();
    }
});

// Inserir nova atividade
app.post('/atividades', async (req, res) => {
    let conn;
    try {
        const { data, nome, principais_realizacoes, projeto, detalhamento } = req.body;
        conn = await pool.getConnection();

        await conn.query("INSERT INTO tb_atividades (Data, Nome, `Principais Realizações`, Projeto, Detalhamento) VALUES (?, ?, ?, ?, ?)", [data, nome, principais_realizacoes, projeto, detalhamento]);

        res.redirect('/formulario_atividades');
    } catch (err) {
        console.error("Erro ao inserir atividade:", err);
        res.status(500).send('Erro ao cadastrar atividade.');
    } finally {
        if (conn) conn.release();
    }
});

// Excluir atividade
app.post('/atividades/excluir/:id', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query("DELETE FROM tb_atividades WHERE id = ?", [req.params.id]);
        res.redirect('/formulario_atividades');
    } catch (err) {
        console.error("Erro ao excluir:", err);
        res.status(500).send('Erro ao excluir atividade.');
    } finally {
        if (conn) conn.release();
    }
});

// Editar atividade (formulário)
app.get('/atividades/editar/:id', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const atividade = await conn.query("SELECT * FROM tb_atividades WHERE id = ?", [req.params.id]);
        res.render('editar_atividade', { atividade: atividade[0] });
    } catch (err) {
        console.error("Erro ao buscar atividade:", err);
        res.status(500).send('Erro ao buscar atividade.');
    } finally {
        if (conn) conn.release();
    }
});

// Salvar edição
app.post('/atividades/editar/:id', async (req, res) => {
    let conn;
    try {
        const { data, nome, principais_realizacoes, projeto, detalhamento } = req.body;
        conn = await pool.getConnection();

        await conn.query(`
            UPDATE tb_atividades
            SET Data=?, Nome=?, \`Principais Realizações\`=?, Projeto=?, Detalhamento=?
            WHERE id=?
        `, [data, nome, principais_realizacoes, projeto, detalhamento, req.params.id]);

        res.redirect('/formulario_atividades');
    } catch (err) {
        console.error("Erro ao atualizar atividade:", err);
        res.status(500).send('Erro ao atualizar atividade.');
    } finally {
        if (conn) conn.release();
    }
});


// --- Rota de Exportação de Excel (Ajustada e Unificada) ---

app.get('/exportar-excel', async (req, res) => {
    let conn;
    try {
        const { nome_usuario, data_inicio, data_fim } = req.query;

        let sql = 'SELECT * FROM tb_atividades WHERE 1=1';
        const params = [];

        if (nome_usuario) {
            sql += ' AND Nome LIKE ?';
            params.push(`%${nome_usuario}%`);
        }

        if (data_inicio) {
            sql += ' AND Data >= ?';
            params.push(data_inicio);
        }

        if (data_fim) {
            sql += ' AND Data <= ?';
            params.push(data_fim);
        }
        
        sql += ' ORDER BY Data DESC';

        conn = await pool.getConnection();
        const atividades = await conn.query(sql, params);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Atividades');

        const colunas = [
            'ID',
            'Data',
            'Nome',
            'Principais Realizações',
            'Projeto',
            'Detalhamento'
        ];
        worksheet.addRow(colunas);

        atividades.forEach(atividade => {
            worksheet.addRow([
                atividade.id,
                atividade.Data.toLocaleDateString('pt-BR'), // Esta linha foi alterada
                atividade.Nome,
                atividade['Principais Realizações'],
                atividade.Projeto,
                atividade.Detalhamento
            ]);
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="relatorio-atividades.xlsx"');

        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error("Erro ao gerar arquivo Excel:", err);
        res.status(500).send('Erro ao gerar relatório.');
    } finally {
        if (conn) conn.release();
    }
});





// --- Inicialização ---
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
        console.error(err);
        process.exit(1);
    } finally {
        if (conn) conn.release();
    }
}

startServer();
