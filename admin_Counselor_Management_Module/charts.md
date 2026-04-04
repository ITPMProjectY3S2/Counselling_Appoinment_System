# Admin Dashboard Charts Implementation

## Goal Description
Add two charts below the Stat cards on the Admin Dashboard:
1. Appointments over time (monthly) (Bar Chart).
2. Sessions per counselor (Pie Chart).

We will use the **Recharts** library to render these charts. Since the current `/api/admin/stats` backend endpoint only returns aggregate totals, we will fetch the list of appointments via `/api/admin/appointments`, and perform the data grouping on the frontend to drive the charts.

## Proposed Changes

### Frontend - Admin Dashboard
#### [MODIFY] AdminDashboard.jsx(file:///d:/SLIIT/Y3S2/IT%20Project%20Management%20%28IT3040%29/4.%20Assignment/Week%2008/Counseling-Appointment-System/ITPM-Project/frontend/src/pages/AdminDashboard.jsx)
- **Imports:** Import necessary components from `recharts` (BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend).
- **State Management:** Add a new state variable `appointments` initialized to `[]`.
- **Data Fetching:** Update [fetchData](file:///d:/SLIIT/Y3S2/IT%20Project%20Management%20%28IT3040%29/4.%20Assignment/Week%2008/Counseling-Appointment-System/ITPM-Project/frontend/src/pages/AdminDashboard.jsx#129-145) function to include an API call to `/api/admin/appointments` in the `Promise.all` array, and set the state.
- **Data Transformation:** Create two `useMemo` hooks or variables to format the `appointments` data.
  - `monthlyData`: Map appointment dates to their month name (e.g. "Jan", "Feb") and count total appointments per month.
  - `counselorData`: Group appointments by `counselorId.userId.name` and count sessions.
- **UI:** Insert a new section below the Stat cards with a CSS Grid layout for the two charts, using styled Recharts components. Add specific colors such as `["#3b82f6", "#8b5cf6", "#22c55e", "#f97316", "#ef4444", "#0ea5e9"]` for the pie chart slices to match the platform's color scheme.

## Verification Plan

### Manual Verification
1. Open the Admin Dashboard page in the browser.
2. Verify that the Bar Chart (Appointments over time) and Pie Chart (Sessions per counselor) display correctly below the stat cards.
3. Verify the charts populate with existing data (or gracefully handle an empty state if no appointments are present).
4. Verify responsiveness of the charts ensuring they shrink and grow gracefully using `ResponsiveContainer`.
