const db = require('../database/db');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// JWT_SECRET deve ser definido como variável de ambiente (sem fallback em produção).
// Configure esta variável no painel do Render antes de publicar.
const JWT_SECRET = process.env.JWT_SECRET;

// Função auxiliar para tentar obter o ID do usuário através do Token, se disponível (opcional)
function getOptionalUserId(req) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.id;
  } catch (err) {
    return null;
  }
}

// 1. Listar todos os eventos (Público, com filtros e contagem de participantes)
exports.getAllEvents = (req, res) => {
  const userId = getOptionalUserId(req);
  const { search, category, date } = req.query;

  let query = `
    SELECT e.*,
      (SELECT COUNT(*) FROM registrations WHERE event_id = e.id) AS participant_count,
      ? AS request_user_id,
      (SELECT COUNT(*) FROM registrations WHERE event_id = e.id AND user_id = ?) > 0 AS user_registered,
      (SELECT COUNT(*) FROM favorites WHERE event_id = e.id AND user_id = ?) > 0 AS user_favorited
    FROM events e
    WHERE 1=1
  `;
  const params = [userId, userId, userId];

  if (search) {
    query += ' AND (e.title LIKE ? OR e.description LIKE ?)';
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam);
  }

  if (category) {
    query += ' AND e.category = ?';
    params.push(category);
  }

  if (date) {
    // Filtrar por data específica ou a partir dela (formato YYYY-MM-DD)
    query += ' AND date(e.date_time) >= date(?)';
    params.push(date);
  }

  // Ordenar por data de realização mais próxima
  query += ' ORDER BY e.date_time ASC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao buscar eventos.', error: err.message });
    }

    // Converter booleanos do SQLite (0/1) para true/false
    const formattedEvents = rows.map((event) => ({
      ...event,
      user_registered: !!event.user_registered,
      user_favorited: !!event.user_favorited
    }));

    res.status(200).json(formattedEvents);
  });
};

// 2. Detalhes de um evento específico (Público)
exports.getEventById = (req, res) => {
  const { id } = req.params;
  const userId = getOptionalUserId(req);

  const query = `
    SELECT e.*,
      (SELECT COUNT(*) FROM registrations WHERE event_id = e.id) AS participant_count,
      (SELECT COUNT(*) FROM registrations WHERE event_id = e.id AND user_id = ?) > 0 AS user_registered,
      (SELECT COUNT(*) FROM favorites WHERE event_id = e.id AND user_id = ?) > 0 AS user_favorited
    FROM events e
    WHERE e.id = ?
  `;

  db.get(query, [userId, userId, id], (err, event) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao buscar detalhes do evento.', error: err.message });
    }
    if (!event) {
      return res.status(404).json({ message: 'Evento não encontrado.' });
    }

    event.user_registered = !!event.user_registered;
    event.user_favorited = !!event.user_favorited;

    res.status(200).json(event);
  });
};

// 3. Criar Evento (Admin)
exports.createEvent = (req, res) => {
  const { title, description, date_time, location, category, capacity } = req.body;

  // Resolver a imagem: arquivo enviado via upload OU URL colada no campo de texto
  let resolvedImageUrl = req.body.image_url || '';
  if (req.file) {
    // Arquivo enviado: gera URL relativa servida pela rota estática /uploads
    resolvedImageUrl = `/uploads/${req.file.filename}`;
  }

  if (!title || !description || !date_time || !location || !category || !resolvedImageUrl || capacity === undefined) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios para a criação de um evento. Inclua uma imagem (URL ou arquivo).' });
  }

  const parsedCapacity = parseInt(capacity, 10);
  if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
    return res.status(400).json({ message: 'A capacidade deve ser um número inteiro maior que zero.' });
  }

  const query = `
    INSERT INTO events (title, description, date_time, location, category, image_url, capacity)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [title, description, date_time, location, category, resolvedImageUrl, parsedCapacity], function (err) {
    if (err) {
      return res.status(500).json({ message: 'Erro ao criar o evento.', error: err.message });
    }

    res.status(201).json({
      message: 'Evento criado com sucesso!',
      event: {
        id: this.lastID,
        title,
        description,
        date_time,
        location,
        category,
        image_url: resolvedImageUrl,
        capacity: parsedCapacity
      }
    });
  });
};

// 4. Editar Evento (Admin)
exports.updateEvent = (req, res) => {
  const { id } = req.params;
  const { title, description, date_time, location, category, capacity } = req.body;

  // Resolver a imagem: arquivo enviado via upload OU URL colada (mantida do formulário)
  let resolvedImageUrl = req.body.image_url || '';
  if (req.file) {
    resolvedImageUrl = `/uploads/${req.file.filename}`;
  }

  if (!title || !description || !date_time || !location || !category || !resolvedImageUrl || capacity === undefined) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios para atualizar o evento. Inclua uma imagem (URL ou arquivo).' });
  }

  const parsedCapacity = parseInt(capacity, 10);
  if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
    return res.status(400).json({ message: 'A capacidade deve ser um número inteiro maior que zero.' });
  }

  // Verificar se evento existe
  db.get('SELECT id FROM events WHERE id = ?', [id], (err, event) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao verificar o evento.', error: err.message });
    }
    if (!event) {
      return res.status(404).json({ message: 'Evento não encontrado.' });
    }

    const query = `
      UPDATE events
      SET title = ?, description = ?, date_time = ?, location = ?, category = ?, image_url = ?, capacity = ?
      WHERE id = ?
    `;

    db.run(query, [title, description, date_time, location, category, resolvedImageUrl, parsedCapacity, id], (err) => {
      if (err) {
        return res.status(500).json({ message: 'Erro ao atualizar o evento.', error: err.message });
      }

      res.status(200).json({
        message: 'Evento atualizado com sucesso!',
        event: {
          id: parseInt(id, 10),
          title,
          description,
          date_time,
          location,
          category,
          image_url: resolvedImageUrl,
          capacity: parsedCapacity
        }
      });
    });
  });
};

// 5. Excluir Evento (Admin)
exports.deleteEvent = (req, res) => {
  const { id } = req.params;

  db.get('SELECT id FROM events WHERE id = ?', [id], (err, event) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao verificar o evento.', error: err.message });
    }
    if (!event) {
      return res.status(404).json({ message: 'Evento não encontrado.' });
    }

    db.run('DELETE FROM events WHERE id = ?', [id], (err) => {
      if (err) {
        return res.status(500).json({ message: 'Erro ao excluir o evento.', error: err.message });
      }
      res.status(200).json({ message: 'Evento excluído com sucesso.' });
    });
  });
};

// 6. Confirmar ou Cancelar Presença (Visitante)
exports.toggleParticipation = (req, res) => {
  const eventId = parseInt(req.params.id, 10);
  const userId = req.user.id;

  // Verificar se o evento existe
  db.get(`
    SELECT e.*,
      (SELECT COUNT(*) FROM registrations WHERE event_id = e.id) AS participant_count
    FROM events e
    WHERE e.id = ?
  `, [eventId], (err, event) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao verificar o evento.', error: err.message });
    }
    if (!event) {
      return res.status(404).json({ message: 'Evento não encontrado.' });
    }

    // Verificar se o usuário já está inscrito
    db.get('SELECT id FROM registrations WHERE user_id = ? AND event_id = ?', [userId, eventId], (err, reg) => {
      if (err) {
        return res.status(500).json({ message: 'Erro ao verificar inscrição.', error: err.message });
      }

      if (reg) {
        // Já está inscrito: cancelar presença
        db.run('DELETE FROM registrations WHERE user_id = ? AND event_id = ?', [userId, eventId], (err) => {
          if (err) {
            return res.status(500).json({ message: 'Erro ao cancelar presença.', error: err.message });
          }
          res.status(200).json({
            message: 'Presença cancelada com sucesso.',
            user_registered: false,
            participant_count: event.participant_count - 1
          });
        });
      } else {
        // Não está inscrito: verificar capacidade
        if (event.participant_count >= event.capacity) {
          return res.status(400).json({ message: 'Este evento já está com a capacidade máxima esgotada.' });
        }

        db.run('INSERT INTO registrations (user_id, event_id) VALUES (?, ?)', [userId, eventId], (err) => {
          if (err) {
            return res.status(500).json({ message: 'Erro ao confirmar presença.', error: err.message });
          }
          res.status(200).json({
            message: 'Presença confirmada com sucesso! Nos vemos lá.',
            user_registered: true,
            participant_count: event.participant_count + 1
          });
        });
      }
    });
  });
};

// 7. Favoritar ou Desfavoritar Evento (Visitante)
exports.toggleFavorite = (req, res) => {
  const eventId = parseInt(req.params.id, 10);
  const userId = req.user.id;

  db.get('SELECT id FROM events WHERE id = ?', [eventId], (err, event) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao verificar o evento.', error: err.message });
    }
    if (!event) {
      return res.status(404).json({ message: 'Evento não encontrado.' });
    }

    // Verificar se já está nos favoritos
    db.get('SELECT id FROM favorites WHERE user_id = ? AND event_id = ?', [userId, eventId], (err, fav) => {
      if (err) {
        return res.status(500).json({ message: 'Erro ao verificar favoritos.', error: err.message });
      }

      if (fav) {
        // Remover dos favoritos
        db.run('DELETE FROM favorites WHERE user_id = ? AND event_id = ?', [userId, eventId], (err) => {
          if (err) {
            return res.status(500).json({ message: 'Erro ao remover dos favoritos.', error: err.message });
          }
          res.status(200).json({
            message: 'Evento removido dos favoritos.',
            user_favorited: false
          });
        });
      } else {
        // Adicionar aos favoritos
        db.run('INSERT INTO favorites (user_id, event_id) VALUES (?, ?)', [userId, eventId], (err) => {
          if (err) {
            return res.status(500).json({ message: 'Erro ao favoritar evento.', error: err.message });
          }
          res.status(200).json({
            message: 'Evento adicionado aos favoritos!',
            user_favorited: true
          });
        });
      }
    });
  });
};
