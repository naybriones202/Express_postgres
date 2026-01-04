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

    // 1. Buscar usuario por su cédula
    const query = "SELECT * FROM usuarios WHERE cedula = $1";
    const result = await pool.query(query, [cedula]);

    if (result.rows.length === 0) {
      return res.status(401).json({ msg: "Usuario no encontrado" });
    }

    const usuario = result.rows[0];

    // 2. Comparar contraseña ingresada con la encriptada
    const valido = await bcrypt.compare(clave, usuario.clave);

    if (!valido) {
      return res.status(401).json({ msg: "Contraseña incorrecta" });
    }

    // 3. Respuesta correcta
    delete usuario.clave; // Opcional, por seguridad

    res.json({ msg: "Ingreso exitoso", usuario });
    
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

    if (!nombre) {
      return res.status(400).json({ msg: "Nombre obligatorio" });
    }

    const existe = await pool.query(
      "SELECT 1 FROM materia WHERE LOWER(nombre) = LOWER($1)",
      [nombre]
    );

    if (existe.rows.length > 0) {
      return res.status(409).json({ msg: "La materia ya existe" });
    }

    const result = await pool.query(
      "INSERT INTO materia (nombre) VALUES ($1) RETURNING codigo, nombre",
      [nombre]
    );

    res.json({ msg: "Materia registrada", data: result.rows[0] });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// =====================
// BUSCAR MATERIA
// =====================
app.get("/materia", async (req, res) => {
  try {
    const { buscar } = req.query;

    const result = buscar
      ? await pool.query(
          "SELECT codigo, nombre FROM materia WHERE nombre ILIKE $1 ORDER BY codigo",
          [`%${buscar}%`]
        )
      : await pool.query(
          "SELECT codigo, nombre FROM materia ORDER BY codigo"
        );

    res.json(result.rows);

  } catch (error) {
    res.status(500).json({ error: "Error al obtener materias" });
  }
});


app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});