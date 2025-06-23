from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)


# Banco SQLite para exemplo
def db_connection():
    conn = sqlite3.connect("moneyguard.db")
    conn.row_factory = sqlite3.Row
    return conn


@app.route("/login", methods=["POST"])
def login():
    data = request.json
    usuario = data["usuario"]
    senha = data["senha"]

    conn = db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM usuarios WHERE nome=? AND senha=?", (usuario, senha))
    row = cursor.fetchone()

    if row:
        return jsonify({"success": True, "user_id": row["id"]})
    else:
        return jsonify({"success": False}), 401


@app.route("/transacoes", methods=["GET"])
def listar_transacoes():
    conn = db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM transacoes")
    transacoes = [dict(row) for row in cursor.fetchall()]
    return jsonify(transacoes)


@app.route("/categorias", methods=["GET"])
def listar_categorias():
    conn = db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM categorias")
    categorias = [dict(row) for row in cursor.fetchall()]
    return jsonify(categorias)

@app.route("/transacoes", methods=["POST"])
def adicionar_transacao():
    data = request.json
    conn = db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO transacoes (usuario_id, tipo, valor, descricao, data, categoria_id) VALUES (?, ?, ?, ?, ?, ?)",
        (data["usuario_id"], data["tipo"], data["valor"], data["descricao"], data["data"], data["categoria_id"])
    )
    conn.commit()
    return jsonify({"success": True}), 201


if __name__ == "__main__":
    app.run(debug=True)
