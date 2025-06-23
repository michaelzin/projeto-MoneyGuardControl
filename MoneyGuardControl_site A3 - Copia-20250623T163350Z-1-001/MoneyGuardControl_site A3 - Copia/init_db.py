import sqlite3

conn = sqlite3.connect("moneyguard.db")
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    senha TEXT NOT NULL
);
""")

cursor.execute("""
CREATE TABLE categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL
);
""")

cursor.execute("""
CREATE TABLE transacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    tipo TEXT,
    valor REAL,
    descricao TEXT,
    data TEXT,
    categoria_id INTEGER,
    FOREIGN KEY(usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY(categoria_id) REFERENCES categorias(id)
);
""")

cursor.execute("INSERT INTO usuarios (nome, email, senha) VALUES ('admin', 'admin@moneyguard.com', '1234')")
cursor.executemany("INSERT INTO categorias (nome) VALUES (?)", [
    ('Alimentação',), ('Transporte',), ('Moradia',),
    ('Saúde',), ('Educação',), ('Lazer',), ('Outros',)
])

conn.commit()
conn.close()
print("Banco criado com sucesso.")
