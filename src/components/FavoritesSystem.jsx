import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../Firebase/Firebase.js';
import { useAuth } from '../contexts/authContext';

const FavoritesContext = createContext();

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
};

const readLocalFavorites = () => {
  try {
    return JSON.parse(localStorage.getItem('favorites') || '[]');
  } catch {
    return [];
  }
};

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    loadFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid]);

  const loadFavorites = async () => {
    setIsLoading(true);
    const local = readLocalFavorites();

    if (currentUser) {
      // Logged in: merge the account's favorites with anything saved locally,
      // so favorites picked before logging in are kept.
      try {
        const snap = await getDoc(doc(db, 'users', currentUser.uid));
        const remote = snap.exists() ? snap.data().favorites || [] : [];
        const merged = [...new Set([...remote, ...local])];
        setFavorites(merged);
        localStorage.setItem('favorites', JSON.stringify(merged));
        if (merged.length !== remote.length) {
          await setDoc(doc(db, 'users', currentUser.uid), { favorites: merged }, { merge: true });
        }
      } catch (error) {
        console.error('Favorites sync failed, using local copy:', error);
        setFavorites(local);
      }
    } else {
      setFavorites(local);
    }
    setIsLoading(false);
  };

  const saveFavorites = async (newFavorites) => {
    setFavorites(newFavorites);
    try {
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error saving favorites locally:', error);
    }
    if (currentUser) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid), { favorites: newFavorites }, { merge: true });
      } catch (error) {
        console.error('Favorites sync failed:', error);
      }
    }
  };

  const addFavorite = async (albumId) => {
    console.log('Adding favorite:', albumId);
    if (!favorites.includes(albumId)) {
      const newFavorites = [...favorites, albumId];
      await saveFavorites(newFavorites);
    }
  };

  const removeFavorite = async (albumId) => {
    console.log('Removing favorite:', albumId);
    const newFavorites = favorites.filter(id => id !== albumId);
    await saveFavorites(newFavorites);
  };

  const toggleFavorite = async (albumId) => {
    console.log('Toggling favorite:', albumId, 'Current favorites:', favorites);
    if (favorites.includes(albumId)) {
      await removeFavorite(albumId);
    } else {
      await addFavorite(albumId);
    }
  };

  const isFavorite = (albumId) => {
    return favorites.includes(albumId);
  };

  const value = {
    favorites,
    isLoading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    favoritesCount: favorites.length,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const FavoriteButton = ({ albumId, size = "default", className = "" }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  // 'on' / 'off' plays the matching animation; burst restarts the sparks on each favorite
  const [motion, setMotion] = useState(null);
  const [burst, setBurst] = useState(0);
  const resetTimer = useRef(0);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const favorited = isFavorite(albumId);

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    clearTimeout(resetTimer.current);
    if (favorited) {
      setMotion('off');
    } else {
      setMotion('on');
      setBurst((n) => n + 1);
    }
    resetTimer.current = setTimeout(() => setMotion(null), 800);
    await toggleFavorite(albumId);
  };
  
  const sizeClasses = {
    small: "w-8 h-8",
    medium: "w-10 h-10",
    default: "w-10 h-10",
    large: "w-12 h-12"
  };

  const iconSizes = {
    small: "w-4 h-4",
    medium: "w-5 h-5",
    default: "w-5 h-5",
    large: "w-6 h-6"
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`fav-btn lg-btn ${favorited ? 'lg-btn-prominent' : 'lg-btn-clear'} ${sizeClasses[size]} rounded-full flex items-center justify-center transition-colors ${
        favorited
          ? 'bg-blue-500 hover:bg-blue-600 text-white'
          : 'bg-card hover:bg-secondary border border-border text-foreground'
      } ${motion ? `fav-${motion}` : ''} ${className}`}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={favorited}
    >
      <span className="fav-stage">
        {motion === 'on' && (
          <span key={burst} className="fav-burst" aria-hidden="true">
            <span className="fav-ring" />
            {Array.from({ length: 8 }, (_, i) => (
              <span key={i} className="fav-spark" style={{ '--a': `${i * 45}deg` }} />
            ))}
          </span>
        )}
        <svg
          className={`fav-heart ${iconSizes[size]}`}
          fill="currentColor"
          fillOpacity={favorited ? 1 : 0}
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
          />
        </svg>
      </span>
    </button>
  );
};

export default FavoritesProvider;