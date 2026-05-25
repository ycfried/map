# Location Data Manager

A secure multi-user data management system with mapping capabilities, built with Next.js, Supabase, MongoDB, and Google Places API.

## Features

✅ **User Authentication** - Secure login/signup with Supabase Auth  
✅ **Role-Based Access Control** - User and Admin roles with data isolation  
✅ **Address Autocomplete** - Smart address search powered by Google Places API  
✅ **Location Storage** - Store addresses with precise coordinates (lat/lng)  
✅ **Interactive Maps** - Visualize data on Leaflet maps  
✅ **Data Management** - Create, view, and delete location entries  
✅ **Multi-User Support** - Users see only their data, admins see everything  

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS, shadcn/ui
- **Authentication & DB:** Supabase (PostgreSQL with RLS)
- **Data Storage:** MongoDB (with GeoJSON support)
- **Maps:** Leaflet
- **Address Autocomplete:** Google Places API

## Prerequisites

- Node.js 18+ and Yarn
- Supabase account (https://supabase.com)
- Google Cloud account with Maps Platform enabled
- MongoDB instance (already configured)

## Setup Instructions

### 1. Supabase Setup

1. Go to https://supabase.com/dashboard
2. Create a new project
3. Once the project is ready, go to **SQL Editor**
4. Copy the contents of `SUPABASE_SETUP.sql` file
5. Paste and run it in the SQL Editor
6. This will create:
   - `profiles` table with role-based access
   - Row Level Security (RLS) policies
   - Admin helper functions
   - Auto-trigger to create profiles for new users

### 2. Create an Admin User (Optional)

1. Sign up through the app first
2. Go to Supabase SQL Editor
3. Run this query (replace with your email):
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);
```

### 3. Google Maps API Setup

1. Go to https://console.cloud.google.com
2. Create a new project or select existing
3. Enable these APIs:
   - Places API
   - Geocoding API
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. **Restrict the API key:**
   - API restrictions: Select "Places API" and "Geocoding API"
   - (Optional) Application restrictions: Set HTTP referrer or IP restrictions

### 4. Environment Variables

The `.env` file is already configured with your credentials:

```
MONGO_URL=mongodb://localhost:27017
DB_NAME=location_data_app
NEXT_PUBLIC_SUPABASE_URL=https://efnunbobkovmczeyiawa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_rBV8ZFbnO7OZk7B2LQRtZg_OL2rLteR
GOOGLE_MAPS_API_KEY=AIzaSyAYE5KK5dlokCe0VuRzDRXx-8SNU6ZAzto
```

### 5. Install Dependencies

Dependencies are already installed. If needed, run:

```bash
yarn install
```

### 6. Run the Application

The application should already be running. If not:

```bash
yarn dev
```

Visit: https://8af3a1b5-a43e-4437-9f03-6af88de56a3c.preview.emergentagent.com

## Usage Guide

### For Regular Users

1. **Sign Up** - Create an account at `/auth/signup`
2. **Sign In** - Log in at `/auth/login`
3. **Submit Data:**
   - Enter a title for your entry
   - Type an address (autocomplete will suggest)
   - Add optional notes
   - Click "Submit Entry"
4. **View Data:**
   - Switch between Map View and List View
   - See your entries on the interactive map
   - Click markers for details
5. **Delete Entries** - Click the trash icon on any entry

### For Admins

Admins have all user capabilities plus:
- View ALL submissions from all users
- See user emails on entries
- Manage all entries in the system

## Project Structure

```
/app
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Login, signup, logout
│   │   ├── places/       # Address autocomplete
│   │   └── submissions/  # Data CRUD operations
│   ├── auth/             # Auth pages
│   ├── dashboard/        # Main dashboard
│   └── page.js           # Landing page
├── components/           # React components
│   ├── address-autocomplete.js
│   ├── map-component.js
│   ├── submission-form.js
│   └── submissions-list.js
├── lib/                  # Utilities
│   ├── supabase/        # Supabase clients
│   ├── mongodb.js       # MongoDB connection
│   └── google-places.js # Google Places integration
└── middleware.js         # Route protection
```

## Data Models

### MongoDB Collection: `submissions`

```javascript
{
  "_id": ObjectId,
  "userId": "uuid",           // Supabase user ID
  "userEmail": "string",
  "description": "string",    // Address description
  "formattedAddress": "string",
  "latitude": number,
  "longitude": number,
  "location": {               // GeoJSON Point
    "type": "Point",
    "coordinates": [lng, lat]
  },
  "placeId": "string",
  "formData": {
    "title": "string",
    "notes": "string"
  },
  "createdAt": Date
}
```

### Supabase Table: `profiles`

```sql
- id: UUID (references auth.users)
- role: TEXT ('user' or 'admin')
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

## Security Features

1. **Authentication** - Supabase Auth with JWT tokens
2. **Row-Level Security (RLS)** - Database-level access control
3. **Server-Side API Keys** - Google API key never exposed to browser
4. **Role-Based Access** - Users isolated from each other's data
5. **Middleware Protection** - Routes guarded at server level

## API Endpoints

### Authentication
- `POST /api/auth/login` - Sign in
- `POST /api/auth/signup` - Create account
- `POST /api/auth/logout` - Sign out

### Submissions
- `GET /api/submissions` - List submissions (filtered by role)
- `POST /api/submissions` - Create submission
- `DELETE /api/submissions?id=` - Delete submission

### Places
- `GET /api/places/autocomplete?q=` - Get address suggestions

## Troubleshooting

### "Failed to fetch suggestions"
- Check Google Maps API key is valid
- Verify Places API and Geocoding API are enabled
- Check API key restrictions

### "Unauthorized" errors
- Ensure you're logged in
- Check Supabase URL and keys are correct
- Verify middleware is working

### Map not loading
- Check browser console for errors
- Ensure Leaflet CSS is loaded
- Verify coordinates are valid

### Profile/role issues
- Run `SUPABASE_SETUP.sql` in Supabase SQL Editor
- Check if profile was created: `SELECT * FROM profiles;`
- Verify RLS policies are enabled

## MongoDB Geospatial Queries

The app stores locations as GeoJSON Points. To create a geospatial index:

```javascript
db.submissions.createIndex({ location: "2dsphere" })
```

Example query to find nearby locations:

```javascript
db.submissions.find({
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [longitude, latitude]
      },
      $maxDistance: 5000 // meters
    }
  }
})
```

## Future Enhancements

- [ ] Clustering on map for performance with many markers
- [ ] Export data as CSV/GeoJSON
- [ ] Advanced filtering and search
- [ ] Bulk upload via CSV
- [ ] Mobile PWA support
- [ ] Real-time updates with Supabase Realtime

## License

MIT

## Support

For issues or questions, please check the troubleshooting section above or contact support.
