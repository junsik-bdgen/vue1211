import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useNoticeStore = defineStore("notices", () => {
  const notices = ref([]);
  const isLoading = ref(false);
  const error = ref(null);

  const fetchNotices = async () => {
    isLoading.value = true;
    error.value = null;
    
    console.log('🔄 Fetching notices from API...');
    
    try {
      const response = await fetch("/api/notices");
      
      console.log('📡 API Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch notices: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Notices loaded from DB:', data.length, 'items');
      console.log('📊 Data:', data);
      
      notices.value = data;
      
      if (data.length === 0) {
        console.warn('⚠️  No notices found in database');
      }
    } catch (e) {
      console.error("❌ Error fetching notices:", e);
      console.error("Error details:", e.message);
      error.value = e.message;
    } finally {
      isLoading.value = false;
      console.log('✅ Fetch complete. Total notices:', notices.value.length);
    }
  };

  const eventsByDate = computed(() => {
    const map = {};
    notices.value.forEach((notice) => {
      if (!map[notice.date]) {
        map[notice.date] = [];
      }
      map[notice.date].push(notice);
    });
    return map;
  });

  const addNotice = async (noticeData) => {
    try {
      console.log("📤 Sending notice to API:", noticeData);

      const response = await fetch("/api/notices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...noticeData,
          author: noticeData.author || "관리자",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create notice");
      }

      const newNotice = await response.json();
      console.log("✅ Notice created successfully:", newNotice);

      // Add to local state
      notices.value.unshift(newNotice);

      return newNotice;
    } catch (e) {
      console.error("❌ Error adding notice:", e);
      error.value = e.message;
      throw e;
    }
  };

  const updateNotice = async (updatedNotice) => {
    try {
      console.log("📤 Updating notice:", updatedNotice);

      const response = await fetch(`/api/notices/${updatedNotice.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedNotice),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update notice");
      }

      const updated = await response.json();
      console.log("✅ Notice updated successfully:", updated);

      // Update local state
      const index = notices.value.findIndex((n) => n.id === updatedNotice.id);
      if (index !== -1) {
        notices.value[index] = updated;
      }

      return updated;
    } catch (e) {
      console.error("❌ Error updating notice:", e);
      error.value = e.message;
      throw e;
    }
  };

  const deleteNotice = async (id) => {
    try {
      const response = await fetch(`/api/notices/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete notice");

      notices.value = notices.value.filter((n) => n.id !== id);
    } catch (e) {
      console.error("Error deleting notice:", e);
      throw e;
    }
  };

  const getNoticeById = (id) => {
    return notices.value.find((n) => n.id === Number(id));
  };

  const incrementViews = async (id) => {
    try {
      await fetch(`/api/notices/${id}/views`, {
        method: "PATCH",
      });
      // Update local state
      const notice = notices.value.find((n) => n.id === Number(id));
      if (notice) {
        notice.views = (notice.views || 0) + 1;
      }
    } catch (e) {
      console.error("Error incrementing views:", e);
    }
  };

  return {
    notices,
    isLoading,
    error,
    eventsByDate,
    fetchNotices,
    addNotice,
    updateNotice,
    deleteNotice,
    getNoticeById,
    incrementViews,
  };
});
