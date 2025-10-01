// components/MonthYearDropdown.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";

const MONTHS_ID = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

type Props = {
  month: number;          // 0-11
  year: number;           // e.g. 2025
  onChangeMonth: (m: number) => void;
  onChangeYear: (y: number) => void;
  yearsRange?: { start: number; end: number }; // inclusive
  labelColor?: string;
};

export default function MonthYearDropdown({
  month, year, onChangeMonth, onChangeYear,
  yearsRange = { start: new Date().getFullYear() - 3, end: new Date().getFullYear() + 1 },
  labelColor = "#111827",
}: Props) {
  const years = [];
  for (let y = yearsRange.start; y <= yearsRange.end; y++) years.push(y);

  return (
    <View style={styles.row}>
      <View style={styles.field}>
        <Text style={[styles.label, { color: labelColor }]}>Bulan</Text>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={month}
            onValueChange={(val) => onChangeMonth(Number(val))}
            dropdownIconColor="#111827"
          >
            {MONTHS_ID.map((m, idx) => (
              <Picker.Item key={m} label={m} value={idx} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.spacer} />

      <View style={styles.field}>
        <Text style={[styles.label, { color: labelColor }]}>Tahun</Text>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={year}
            onValueChange={(val) => onChangeYear(Number(val))}
            dropdownIconColor="#111827"
          >
            {years.map((y) => (
              <Picker.Item key={y} label={String(y)} value={y} />
            ))}
          </Picker>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12 },
  field: { flex: 1 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  pickerWrap: {
    borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, overflow: "hidden",
    backgroundColor: "#fff",
  },
  spacer: { width: 12 },
});

export { MONTHS_ID };
