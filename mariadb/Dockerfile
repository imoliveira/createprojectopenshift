# Usa a imagem oficial do MariaDB
FROM mariadb:10.11

# Define variáveis de ambiente padrão (podem ser sobrescritas no docker-compose)
ENV MYSQL_ROOT_PASSWORD=rootpass \
    MYSQL_DATABASE=mydb \
    MYSQL_USER=myuser \
    MYSQL_PASSWORD=mypass

# Copia scripts SQL de inicialização (se existirem)
COPY sql-files/ /docker-entrypoint-initdb.d/

# Define permissões adequadas
RUN chmod -R 755 /docker-entrypoint-initdb.d

# Expondo a porta padrão
EXPOSE 3306

# O ENTRYPOINT padrão do MariaDB já cuida de iniciar o servidor

