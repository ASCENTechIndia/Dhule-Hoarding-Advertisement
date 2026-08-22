import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css'

// Providers
import { ThemeProvider } from './context/ThemeContext';
import { SidebarProvider } from './context/SidebarContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import AddUser from './pages/AddUser';
import UserDetails from './pages/UserDetails';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Forms from './pages/Forms';
import Tables from './pages/Tables';
import Charts from './pages/Charts';
import Components from './pages/Components';
import Alerts from './pages/Alerts';
import Modals from './pages/Modals';
import Blank from './pages/Blank';
import CreateAgent from './pages/CreateAgent';
import AdvertisementPanchnama from "./pages/citizen/AdvertisementPanchnama";
import ComplaintsTable from "./pages/supervisior/ComplaintsTable"
import ApplicationList from "./pages/supervisior/ApplicationList"
import ApplicationListSI from "./pages/supervisior/ApplicationListSI"
// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Error Pages
import NotFound from './pages/NotFound';
import ServerError from './pages/ServerError';
import ResolvedComplaintList from './pages/supervisior/ResolvedComplaintList';
import PanchanamaList from './pages/supervisior/PanchanamaList';
import NoticeList from './pages/supervisior/NoticeList';
import AssignComplaint from './pages/SI/AssignComplaint';
import ResolvedComplaint from './pages/SI/ResolvedComplaint';
import HomeRedirect from './pages/HomeRedirect';
import FineList from './pages/SI/FineList';
import BillList from './pages/supervisior/BillList';

// Dashboard
import Dashboard2 from './pages/dashboard/Dashboard';
import ComplaintDashboard from './pages/complaintDashboard/ComplaintDashboard';
import NoticeNirmitiReport from './pages/supervisior/NoticeNirmitiReport';
import PanchanamaNirmitiReport from './pages/supervisior/PanchanamaNirmitiReport';
import NoticePaymentReport from './pages/supervisior/NoticePaymentReport';
import WardWiseReport from './pages/supervisior/WardWiseReport';
import MonthlyWiseReport from './pages/supervisior/MonthlyWiseReport';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <SidebarProvider>
          <BrowserRouter>
            <Routes>
              {/* Auth Routes - Public */}
              <Route path="/login" element={<Login />} />
              {/* <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} /> */}

              {/* Main Routes - Protected */}
              <Route path="/" element={<ProtectedRoute><HomeRedirect /></ProtectedRoute>} />
              {/* <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
              <Route path="/add-user" element={<ProtectedRoute><AddUser /></ProtectedRoute>} />
              <Route path="/user-details" element={<ProtectedRoute><UserDetails /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/forms" element={<ProtectedRoute><Forms /></ProtectedRoute>} />
              <Route path="/tables" element={<ProtectedRoute><Tables /></ProtectedRoute>} />
              <Route path="/charts" element={<ProtectedRoute><Charts /></ProtectedRoute>} />
              <Route path="/components" element={<ProtectedRoute><Components /></ProtectedRoute>} />
              <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
              <Route path="/modals" element={<ProtectedRoute><Modals /></ProtectedRoute>} />
              <Route path="/blank" element={<ProtectedRoute><Blank /></ProtectedRoute>} />
              <Route
                path="/create-agent"
                element={
                  <ProtectedRoute>
                    <CreateAgent />
                  </ProtectedRoute>
                }
              /> */}

                <Route
                  path="/advertisementPanchnama-form"
                  element={
                      <ProtectedRoute><AdvertisementPanchnama /></ProtectedRoute>
                  }
                />

                {/* <Route
                  path="/complaint-list"
                  element={
                    <ProtectedRoute>
                      <ComplaintsTable />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/application-list"
                  element={
                    <ProtectedRoute>
                      <ApplicationList />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/application-list-sanitary"
                  element={
                    <ProtectedRoute>
                      <ApplicationListSI />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/fine-list"
                  element={
                    <ProtectedRoute>
                      <FineList />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/all-complaint"
                  element={
                    <ProtectedRoute>
                      <AssignComplaint />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/resolved-complaint"
                  element={
                    <ProtectedRoute>
                      <ResolvedComplaint />
                    </ProtectedRoute>
                  }
                /> */}

                <Route
                  path="/panchanama-list"
                  element={
                    <ProtectedRoute>
                      <PanchanamaList />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/notice-list"
                  element={
                    <ProtectedRoute>
                      <NoticeList />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/notice-nirmiti-report"
                  element={
                    <ProtectedRoute>
                      <NoticeNirmitiReport />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/panchanama-nirmiti-report"
                  element={
                    <ProtectedRoute>
                      <PanchanamaNirmitiReport />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/notice-payment-report"
                  element={
                    <ProtectedRoute>
                      <NoticePaymentReport />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/ward-wise-report"
                  element={
                    <ProtectedRoute>
                      <WardWiseReport />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/monthly-wise-report"
                  element={
                    <ProtectedRoute>
                      <MonthlyWiseReport />
                    </ProtectedRoute>
                  }
                />

                <Route 
                  path='/bill-list'
                  element={
                    <ProtectedRoute>
                      <BillList />
                    </ProtectedRoute>
                  }
                />

                {/* <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard2/>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/complaint-dashboard"
                  element={
                    <ProtectedRoute>
                      <ComplaintDashboard/>
                    </ProtectedRoute>
                  }
                /> */}

              {/* Error Routes */}
              <Route path="/500" element={<ServerError />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </SidebarProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
