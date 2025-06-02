import React, { useEffect, useState } from 'react';
import { getTopUsers } from '../services/leaderboardService';

const Leaderboard = () => {
  const [topUsers, setTopUsers] = useState([]);

  useEffect(() => {
    const fetchTopUsers = async () => {
      const users = await getTopUsers();
      setTopUsers(users);
    };

    fetchTopUsers();
  }, []);

  return (
    <div>
      <h2>Top Performers</h2>
      <ul>
        {topUsers.map((user, index) => (
          <li key={user.uid}>
            {index + 1}. {user.displayName} - {user.points} points
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Leaderboard;
