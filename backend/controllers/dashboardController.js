const db = require('../database/db');

// 1. Estatísticas do Admin (Admin Only)
exports.getAdminDashboard = (req, res) => {
  const stats = {
    totalEvents: 0,
    totalRegistrations: 0,
    categoryStats: [],
    eventsDetail: []
  };

  // Usamos serialização ou consultas encadeadas para obter todos os dados estatísticos
  db.get('SELECT COUNT(*) AS count FROM events', [], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao carregar estatísticas de eventos.', error: err.message });
    }
    stats.totalEvents = row.count;

    db.get('SELECT COUNT(*) AS count FROM registrations', [], (err, row) => {
      if (err) {
        return res.status(500).json({ message: 'Erro ao carregar estatísticas de inscrições.', error: err.message });
      }
      stats.totalRegistrations = row.count;

      db.all('SELECT category, COUNT(*) AS count FROM events GROUP BY category', [], (err, rows) => {
        if (err) {
          return res.status(500).json({ message: 'Erro ao carregar estatísticas de categorias.', error: err.message });
        }
        stats.categoryStats = rows;

        // Obter lista detalhada de eventos com capacidade e participantes
        const queryEvents = `
          SELECT e.id, e.title, e.category, e.date_time, e.capacity, e.location,
            (SELECT COUNT(*) FROM registrations WHERE event_id = e.id) AS participant_count
          FROM events e
          ORDER BY e.date_time ASC
        `;

        db.all(queryEvents, [], (err, rowsEvents) => {
          if (err) {
            return res.status(500).json({ message: 'Erro ao carregar detalhes dos eventos.', error: err.message });
          }
          stats.eventsDetail = rowsEvents;
          res.status(200).json(stats);
        });
      });
    });
  });
};

// 2. Painel do Visitante (Visitor Only)
exports.getVisitorDashboard = (req, res) => {
  const userId = req.user.id;

  const response = {
    registrations: [],
    favorites: []
  };

  // Buscar eventos em que o usuário confirmou presença
  const queryRegistrations = `
    SELECT e.*,
      (SELECT COUNT(*) FROM registrations WHERE event_id = e.id) AS participant_count,
      1 AS user_registered,
      (SELECT COUNT(*) FROM favorites WHERE event_id = e.id AND user_id = ?) > 0 AS user_favorited
    FROM registrations r
    JOIN events e ON r.event_id = e.id
    WHERE r.user_id = ?
    ORDER BY e.date_time ASC
  `;

  db.all(queryRegistrations, [userId, userId], (err, regRows) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao carregar presenças.', error: err.message });
    }

    response.registrations = regRows.map(row => ({
      ...row,
      user_registered: true,
      user_favorited: !!row.user_favorited
    }));

    // Buscar eventos favoritados pelo usuário
    const queryFavorites = `
      SELECT e.*,
        (SELECT COUNT(*) FROM registrations WHERE event_id = e.id) AS participant_count,
        (SELECT COUNT(*) FROM registrations WHERE event_id = e.id AND user_id = ?) > 0 AS user_registered,
        1 AS user_favorited
      FROM favorites f
      JOIN events e ON f.event_id = e.id
      WHERE f.user_id = ?
      ORDER BY e.date_time ASC
    `;

    db.all(queryFavorites, [userId, userId], (err, favRows) => {
      if (err) {
        return res.status(500).json({ message: 'Erro ao carregar favoritos.', error: err.message });
      }

      response.favorites = favRows.map(row => ({
        ...row,
        user_registered: !!row.user_registered,
        user_favorited: true
      }));

      res.status(200).json(response);
    });
  });
};
