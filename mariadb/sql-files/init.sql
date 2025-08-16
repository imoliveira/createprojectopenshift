-- Cria o banco de dados
CREATE DATABASE IF NOT EXISTS db_atividades CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Cria o usuário e define a senha
CREATE USER IF NOT EXISTS 'user_atividades'@'%' IDENTIFIED BY 'Ux6tqz01';
CREATE TABLE tb_atividades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    Data DATE,
    Nome VARCHAR(255),
    `Principais Realizações` TEXT,
    Projeto VARCHAR(255),
    Detalhamento TEXT
);

-- Concede permissões ao usuário no banco criado
GRANT ALL PRIVILEGES ON db_atividades.* TO 'user_atividades'@'%';

-- Aplica as permissões
FLUSH PRIVILEGES;

