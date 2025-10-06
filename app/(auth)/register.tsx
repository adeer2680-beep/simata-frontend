import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [deviceId, setDeviceId] = useState("");

  useEffect(() => {
    (async () => {
      const id = (await AsyncStorage.getItem("device.id")) ?? "";
      setDeviceId(id);
    })();
  }, []);

  const onSubmit = async () => {
    // kirim ke API kamu
    // await api.post("/register", { name, email, device_id: deviceId });
  };

  return (
    <View style={s.wrap}>
      <Text style={s.title}>Register</Text>

      <Text style={s.label}>Nama</Text>
      <TextInput style={s.input} value={name} onChangeText={setName} />

      <Text style={s.label}>Email</Text>
      <TextInput style={s.input} value={email} onChangeText={setEmail} keyboardType="email-address" />

      <Text style={s.label}>Device ID (otomatis)</Text>
      <TextInput style={[s.input, { backgroundColor: "#f9fafb" }]} value={deviceId} editable={false} />

      <Button title="Daftar" onPress={onSubmit} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 16, gap: 10, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "700" },
  label: { fontSize: 12, color: "#374151", fontWeight: "700" },
  input: { borderWidth: 1, borderColor: "#e5e7eb", padding: 12, borderRadius: 10 },
});
