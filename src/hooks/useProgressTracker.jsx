import { useState, useEffect, useCallback } from 'react';

// Configuration for API calls
const API_URL = 'http://127.0.0.1:5000'; // Your Flask backend

/**
 * Custom Hook to manage fetching and updating child's progress.
 * @param {string} category - The category for this lesson (e.g., 'abc', 'numbers').
 */
const useProgressTracker = (category) => {
  const [completedItems, setCompletedItems] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressError, setProgressError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUserId = localStorage.getItem('user_id');
    if (!currentUserId) {
      setProgressError("No user logged in. Progress won't be saved.");
      setIsLoading(false);
      return;
    }
    setUserId(currentUserId);

    const fetchProgress = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/progress/summary/${currentUserId}`);
        if (!response.ok) {
           const errData = await response.json().catch(() => ({ message: 'Could not load progress.' }));
           throw new Error(errData.message || 'Could not load progress.');
        }
        const data = await response.json();
        // --- LOGIC UPDATED FOR NEW DB STRUCTURE ---
        if (data.completed_items && data.completed_items[category]) {
          setCompletedItems(new Set(data.completed_items[category]));
        } else {
          setCompletedItems(new Set());
        }
      } catch (err) {
        console.error("Error fetching progress:", err);
        setProgressError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgress();
  }, [category]);

  const markItemAsComplete = useCallback(async (item, onSuccessCallback) => {
    if (!userId) {
      setProgressError("Cannot save progress. Please log in again.");
      return;
    }
    if (isSubmitting || completedItems.has(item)) return;

    setIsSubmitting(true);
    setProgressError(null);

    try {
      // --- *** ENSURE THIS ENDPOINT MATCHES app.py *** ---
      const response = await fetch(`${API_URL}/api/progress/mark_item_complete`, { // Make sure this is correct!
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          category: category,
          item: item,
          score: 1 // Assuming a score of 1 per item
        }),
      });
      // --- *** END OF CHECK *** ---

      // Check if fetch itself failed (network error)
      if (!response) {
          throw new Error('Network response was not received.'); // More specific error
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to save progress.");
      }

      // Check backend message for already completed items
      if (data.message !== "Item already completed") {
           setCompletedItems(prevSet => new Set(prevSet).add(item));
           if (onSuccessCallback) {
             onSuccessCallback();
           }
       } else {
           if (!completedItems.has(item)) {
               setCompletedItems(prevSet => new Set(prevSet).add(item));
           }
           console.log("Item was already marked as complete.");
       }

    } catch (err) {
      // Log the specific error type
      console.error(`Error updating progress (${err.name}):`, err.message, err); // More detailed logging
      // Differentiate network errors from backend errors
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
           setProgressError('Network error: Could not connect to the server.');
      } else {
           setProgressError(err.message || 'An unknown error occurred while saving.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [userId, category, isSubmitting, completedItems]);

  return { completedItems, isSubmitting, isLoading, progressError, markItemAsComplete };
};

export default useProgressTracker;

