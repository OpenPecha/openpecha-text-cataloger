import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import TextCRUD from './components/crud/Text';
import PersonCRUD from './components/crud/Person';
import TextInstanceCRUD from './components/crud/TextInstances';
import Instance from './components/crud/Instance';

function App() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6">
        <Routes>
          <Route path="/" element={<TextCRUD />} />
          <Route path="/texts" element={<TextCRUD />} />
          <Route path="/persons" element={<PersonCRUD />} />
          <Route path="/texts/:id/instance" element={<TextInstanceCRUD />} />
          <Route path="/instances/:id" element={<Instance />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;