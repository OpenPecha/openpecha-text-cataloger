import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import TextCRUD from './components/crud/TextCRUD';
import PersonCRUD from './components/crud/PersonCRUD';

function App() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6">
        <Routes>
          <Route path="/" element={<TextCRUD />} />
          <Route path="/texts" element={<TextCRUD />} />
          <Route path="/persons" element={<PersonCRUD />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;