import React from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const MOCK_MESSAGES = [
  {
    id: "1",
    title: "Pengumuman UTS",
    body: "UTS dimulai Senin, 14 Oktober 2025. Pastikan hadir tepat waktu.",
    date: "2025-09-23",
    icon: "megaphone-outline",
  },
  {
    id: "2",
    title: "Presensi Masuk",
    body: "Presensi Anda tercatat pada 06:42 WIB.",
    date: "2025-09-23",
    icon: "checkmark-done-outline",
  },
  {
    id: "3",
    title: "Tugas Matematika",
    body: "Kerjakan soal halaman 45 no 1-10, kumpul besok.",
    date: "2025-09-22",
    icon: "book-outline",
  },
];

export default function Inbox() {
  const renderItem = ({ item }: { item: typeof MOCK_MESSAGES[0] }) => (
    <TouchableOpacity style={styles.item} activeOpacity={0.7}>
      <Ionicons
        name={item.icon as any}
        size={24}
        color="#333"
        style={{ marginRight: 12 }}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.title}</Text>
        <Text numberOfLines={1} style={styles.body}>
          {item.body}
        </Text>
      </View>
      <Text style={styles.date}>{item.date}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={MOCK_MESSAGES}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  title: { fontSize: 16, fontWeight: "600", color: "#111" },
  body: { fontSize: 13, color: "#555", marginTop: 2 },
  date: { fontSize: 11, color: "#888", marginLeft: 8 },
  separator: { height: 1, backgroundColor: "#eee" },
});
