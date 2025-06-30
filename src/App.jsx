import { useEffect, useState } from 'react';
import './App.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [input, setInput] = useState('');
  const [time, setTime] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [allTodos, setAllTodos] = useState(() => {
    const saved = localStorage.getItem('dailyTodos');
    return saved ? JSON.parse(saved) : {};
  });
  const [filter, setFilter] = useState('all');
  const [darkMode, setDarkMode] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);

  useEffect(() => {
    localStorage.setItem('dailyTodos', JSON.stringify(allTodos));
  }, [allTodos]);

  useEffect(() => {
    document.body.className = darkMode ? '' : 'light';
  }, [darkMode]);

  useEffect(() => {
    Notification.requestPermission();
    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      const dateKey = now.toISOString().split('T')[0];
      const todosForToday = allTodos[dateKey] || [];
      todosForToday.forEach(todo => {
        if (todo.time === currentTime && !todo.notified) {
          showReminder(todo.text);
          todo.notified = true;
          setAllTodos(prev => ({
            ...prev,
            [dateKey]: [...todosForToday],
          }));
        }
      });
    }, 60000); // check every minute

    return () => clearInterval(interval);
  }, [allTodos]);

  const showReminder = (text) => {
    if (Notification.permission === 'granted') {
      new Notification('🔔 Task Reminder', {
        body: text,
      });
    }
  };

  const todos = allTodos[selectedDate] || [];

  const handleAdd = () => {
    if (input.trim()) {
      const newTodo = {
        id: Date.now(),
        text: input,
        time: time,
        completed: false,
        editing: false,
        notified: false,
      };
      const updatedTodos = [...todos, newTodo];
      setAllTodos({ ...allTodos, [selectedDate]: updatedTodos });
      setInput('');
      setTime('');
      toast.success('✅ Task added successfully!');
    } else {
      toast.error('❌ Please enter a task.');
    }
  };

  const handleToggle = (id) => {
    const updatedTodos = todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    setAllTodos({ ...allTodos, [selectedDate]: updatedTodos });
  };

  const handleDelete = (id) => {
    const updatedTodos = todos.filter(todo => todo.id !== id);
    setAllTodos({ ...allTodos, [selectedDate]: updatedTodos });
    toast.success('🗑️ Task deleted.');
  };

  const handleEdit = (id, value) => {
    const updatedTodos = todos.map(todo =>
      todo.id === id ? { ...todo, text: value } : todo
    );
    setAllTodos({ ...allTodos, [selectedDate]: updatedTodos });
    toast.info('✏️ Task updated.');
  };

  const handleEditMode = (id, mode) => {
    const updatedTodos = todos.map(todo =>
      todo.id === id ? { ...todo, editing: mode } : { ...todo, editing: false }
    );
    setAllTodos({ ...allTodos, [selectedDate]: updatedTodos });
  };

  const filteredTodos = todos.filter(todo => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && !todo.completed) ||
      (filter === 'completed' && todo.completed);

    const matchesSearch = todo.text.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className={`App ${darkMode ? 'dark' : ''}`}>
      <ToastContainer position="top-center" />
      <h1>📅 Daily Todo List</h1>

      <div className="top-buttons">
        <button onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>

      <div className="date-picker">
        <label>Select Date:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      <div className="calendar-toggle">
        <button onClick={() => setShowCalendar(!showCalendar)}>
          {showCalendar ? '➖ Hide Past Records' : '📅 View Past Records'}
        </button>
      </div>

      <div className="todo-input">
        <input
          type="text"
          placeholder="Add a task..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          style={{ maxWidth: '130px' }}
        />
        <button onClick={handleAdd}>Add</button>
      </div>

      <div className="search-input">
        <input
          type="text"
          placeholder="🔍 Search tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="filter-buttons">
        <button onClick={() => setFilter('all')}>All</button>
        <button onClick={() => setFilter('active')}>Active</button>
        <button onClick={() => setFilter('completed')}>Completed</button>
      </div>

      <ul className="todo-list">
        {filteredTodos.map((todo) => (
          <li key={todo.id} className="todo-item">
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => handleToggle(todo.id)}
            />
            {todo.editing ? (
              <input
                type="text"
                value={todo.text}
                onChange={(e) => handleEdit(todo.id, e.target.value)}
                onBlur={() => handleEditMode(todo.id, false)}
                autoFocus
              />
            ) : (
              <span
                className="todo-text"
                style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}
                onDoubleClick={() => handleEditMode(todo.id, true)}
              >
                {todo.text} {todo.time && <small>⏰ {todo.time}</small>}
              </span>
            )}
            <button onClick={() => handleDelete(todo.id)}>❌</button>
          </li>
        ))}
      </ul>

      {showCalendar && (
        <>
          <div className="calendar-overview">
            <h3>📆 Dates with tasks:</h3>
            <ul>
              {Object.entries(allTodos).map(([date, list]) =>
                list.length > 0 ? (
                  <li
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    style={{
                      cursor: 'pointer',
                      fontWeight: date === selectedDate ? 'bold' : 'normal',
                      color: darkMode ? '#90caf9' : '#0077cc',
                    }}
                  >
                    {date} ({list.length})
                  </li>
                ) : null
              )}
            </ul>
          </div>

          <div className="all-tasks-view">
            <h3>📜 All Past Todos</h3>
            {Object.entries(allTodos)
              .sort((a, b) => new Date(b[0]) - new Date(a[0]))
              .map(([date, list]) =>
                list.length > 0 ? (
                  <div key={date} className="past-todos">
                    <h4>{date}</h4>
                    <ul>
                      {list.map((todo) => (
                        <li
                          key={todo.id}
                          style={{
                            textDecoration: todo.completed ? 'line-through' : 'none',
                          }}
                        >
                          {todo.text} {todo.time && <small>⏰ {todo.time}</small>}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null
              )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
