import express from "express";
import cors from "cors";
import { pool } from "./db.js";
import bcrypt from "bcrypt";


const app = express();
app.use(cors());
app.use(express.json());



app.post("/login", async (req, res) => {
  try {
    const { cedula, clave } = req.body;
    
    // Buscamos usuario por cédula y clave
    // NOTA: En producción, las claves deben estar encriptadas (hash).
    const query = "SELECT * FROM usuarios WHERE cedula = $1 AND clave = $2";
    const result = await pool.query(query, [cedula, clave]);

    if (result.rows.length === 0) {
      return res.status(401).json({ msg: "Cédula o contraseña incorrecta" });
    }

    // Devolvemos el usuario (sin la clave por seguridad)
    const usuario = result.rows[0];
    delete usuario.clave; 
    
    res.json({ msg: "Bienvenido", usuario });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================
// REGISTRAR USUARIO
// =====================
app.post("/usuarios", async (req, res) => {
  try {
    const { cedula, nombre, clave } = req.body;

    if (!cedula || !nombre || !clave) {
      return res.status(400).json({ msg: "Todos los campos son obligatorios" });
    }

    const salt = await bcrypt.genSalt(10);
    const claveHash = await bcrypt.hash(clave, salt);

    const result = await pool.query(
      "INSERT INTO usuarios (cedula, nombre, clave) VALUES ($1,$2,$3) RETURNING id, cedula, nombre",
      [cedula, nombre, claveHash]
    );

    res.json({ msg: "Usuario registrado", data: result.rows[0] });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// =====================
// CONSULTAR POR ID
// =====================
app.get("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("SELECT * FROM usuarios WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    res.json(result.rows[0]);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// =====================
// 4. OBTENER TODOS LOS USUARIOS
// =====================
app.get("/usuarios", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM usuarios ORDER BY id ASC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================
// 5. EDITAR USUARIO
// =====================
app.put("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { cedula, nombre, clave } = req.body;
    
    const query = "UPDATE usuarios SET cedula=$1, nombre=$2, clave=$3 WHERE id=$4 RETURNING *";
    const result = await pool.query(query, [cedula, nombre, clave, id]);
    
    if (result.rows.length === 0) return res.status(404).json({ msg: "Usuario no encontrado" });
    res.json({ msg: "Usuario actualizado", usuario: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================
// 6. ELIMINAR USUARIO
// =====================
app.delete("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM usuarios WHERE id = $1", [id]);
    
    if (result.rowCount === 0) return res.status(404).json({ msg: "No encontrado" });
    res.json({ msg: "Usuario eliminado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================
// REGISTRAR MATERIA
// =====================
app.post("/materia", async (req, res) => {
  try {
    const { nombre } = req.body;

    const existe = await pool.query(
      "SELECT * FROM materia WHERE LOWER(nombre) = LOWER($1)",
      [nombre]
    );

    if (existe.rows.length > 0) {
      return res.status(409).json({ msg: "La materia ya existe" });
    }

    const result = await pool.query(
      "INSERT INTO materia (nombre) VALUES ($1) RETURNING *",
      [nombre]
    );

    res.json({ msg: "Materia registrada", data: result.rows[0] });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================
// CONSULTAR MATERIAS
// =====================
app.get("/materia/buscar/:texto", async (req, res) => {
  try {
    const { texto } = req.params;

    const result = await pool.query(
      "SELECT * FROM materia WHERE nombre ILIKE $1 ORDER BY codigo",
      [`%${texto}%`]
    );

    res.json(result.rows);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});
app.get("/materia", async (req, res) => {
  const { buscar } = req.query;

  try {
    const result = buscar
      ? await pool.query(
          "SELECT codigo, nombre FROM materias WHERE nombre ILIKE $1",
          [`%${buscar}%`]
        )
      : await pool.query(
          "SELECT codigo, nombre FROM materias"
        );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener materias" });
  }
});
