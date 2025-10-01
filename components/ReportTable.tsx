// components/ReportTable.tsx
import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";

export type LaporanRow = {
  tanggal: string;  // "2025-09-01"
  datang?: string;  // "06.37.12"
  pulang?: string;  // "14.33.01" or "-"
};

type Props = {
  data: LaporanRow[];
  stickyHeader?: boolean;
};

export default function ReportTable({ data, stickyHeader = false }: Props) {
  const Header = () => (
    <View style={styles.header}>
      <Text style={[styles.cell, styles.headText, { flex: 1.2 }]}>Tanggal</Text>
      <Text style={[styles.cell, styles.headText]}>Datang</Text>
      <Text style={[styles.cell, styles.headText]}>Pulang</Text>
    </View>
  );

  const Row = ({ item }: { item: LaporanRow }) => (
    <View style={styles.row}>
      <Text style={[styles.cell, { flex: 1.2 }]}>{item.tanggal}</Text>
      <Text style={styles.cell}>{item.datang ?? "-"}</Text>
      <Text style={styles.cell}>{item.pulang ?? "-"}</Text>
    </View>
  );

  return (
    <View style={styles.wrap}>
      {stickyHeader ? (
        <FlatList
          data={data}
          keyExtractor={(it, i) => it.tanggal + i}
          ListHeaderComponent={Header}
          stickyHeaderIndices={[0]}
          renderItem={Row}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <>
          <Header />
          {data.map((d, i) => <Row key={d.tanggal + i} item={d} />)}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 14, overflow: "hidden", backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb" },
  header: { flexDirection: "row", backgroundColor: "#2f7f85", paddingVertical: 10 },
  headText: { color: "#fff", fontWeight: "700" },
  row: { flexDirection: "row", backgroundColor: "#fde1bf", marginHorizontal: 10, marginTop: 10, borderRadius: 12, paddingVertical: 12 },
  cell: { flex: 1, textAlign: "center", fontSize: 14 },
});
