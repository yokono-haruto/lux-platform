import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SalesDashboard from "./pages/sales/SalesDashboard";
import CompanyDashboard from "./pages/company/CompanyDashboard";
import Marketplace from "./pages/Marketplace";
import AdminDashboard from "./pages/AdminDashboard";
import UserManagement from "./pages/UserManagement";
import AppointmentManagement from "./pages/AppointmentManagement";
import TransactionsManagement from "./pages/admin/TransactionsManagement";
import BidsManagement from "./pages/admin/BidsManagement";
import BroadcastPage from "./pages/admin/BroadcastPage";
import Messages from "./pages/Messages";
import Settings from "./pages/Settings";
import NotificationDetail from "./pages/NotificationDetail";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/sales/dashboard" component={SalesDashboard} />
      <Route path="/company/dashboard" component={CompanyDashboard} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/users" component={UserManagement} />
      <Route path="/admin/appointments" component={AppointmentManagement} />
      <Route path="/admin/transactions" component={TransactionsManagement} />
      <Route path="/admin/bids" component={BidsManagement} />
      <Route path="/admin/broadcast" component={BroadcastPage} />
      <Route path="/messages" component={Messages} />
      <Route path="/settings" component={Settings} />
      <Route path="/notifications/:id" component={NotificationDetail} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
