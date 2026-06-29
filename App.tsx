import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
} from 'react-native';
import MapView, { Marker, PROVIDER_YANDEX, Region } from 'react-native-maps';
import Icon from 'react-native-vector-icons/Ionicons';

// ============================================================
// ИНТЕРФЕЙСЫ
// ============================================================
interface FuelStock {
  fuel_type: string;
  price: number;
  availability: number;
}

interface GasStation {
  id: number;
  name: string;
  network: string;
  address: string;
  latitude: number;
  longitude: number;
  queue_length: number;
  tanker_active: number;
  fuel_stock: FuelStock[][];
  updated_at: string;
}

interface ReportData {
  station_id: number;
  user_name: string;
  report_type: string;
  fuel_type: string;
  price: number | null;
  queue_length: number | null;
  availability: number | null;
  tanker_active: number;
  description: string;
}

// ============================================================
// КОМПОНЕНТ ФИЛЬТРОВ
// ============================================================
const FilterPanel = ({
  filters,
  setFilters,
}: {
  filters: { fuelType: string; showAvailableOnly: boolean };
  setFilters: (f: any) => void;
}) => {
  const fuelTypes = ['АИ-92', 'АИ-95', 'АИ-98', 'АИ-100', '95*', 'ДТ', 'ДТ*'];

  return (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {fuelTypes.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterChip,
              filters.fuelType === type && styles.filterChipActive,
            ]}
            onPress={() => setFilters({ ...filters, fuelType: type })}
          >
            <Text
              style={[
                styles.filterChipText,
                filters.fuelType === type && styles.filterChipTextActive,
              ]}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[
            styles.filterChip,
            filters.showAvailableOnly && styles.filterChipActive,
          ]}
          onPress={() =>
            setFilters({
              ...filters,
              showAvailableOnly: !filters.showAvailableOnly,
            })
          }
        >
          <Text
            style={[
              styles.filterChipText,
              filters.showAvailableOnly && styles.filterChipTextActive,
            ]}
          >
            {filters.showAvailableOnly ? '✅ В наличии' : '☑️ Все'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// ============================================================
// КОМПОНЕНТ СПИСКА АЗС
// ============================================================
const GasStationList = ({
  stations,
  onStationPress,
  onReportPress,
}: {
  stations: GasStation[];
  onStationPress: (station: GasStation) => void;
  onReportPress: (station: GasStation) => void;
}) => {
  const getQueueColor = (queue: number) => {
    if (queue <= 3) return '#22c55e';
    if (queue <= 6) return '#f59e0b';
    return '#ef4444';
  };

  const getFuelPrice = (station: GasStation, type: string) => {
    const fuelArray = station.fuel_stock?.[0] || [];
    const fuel = fuelArray.find((f) => f.fuel_type === type);
    return fuel ? fuel.price : null;
  };

  const formatPrice = (price: number | null) => {
    return price !== null && price !== undefined ? `${price} ₽` : 'нет';
  };

  const renderItem = ({ item }: { item: GasStation }) => {
    const fuel95 = getFuelPrice(item, 'АИ-95');
    const fuelDt = getFuelPrice(item, 'ДТ');
    const queueColor = getQueueColor(item.queue_length);
    const queueText =
      item.queue_length <= 3
        ? 'Свободно'
        : item.queue_length <= 6
        ? 'Средняя'
        : 'Большая';

    return (
      <TouchableOpacity
        style={styles.listItem}
        onPress={() => onStationPress(item)}
      >
        <View style={styles.listItemHeader}>
          <Text style={styles.listItemName}>{item.name}</Text>
          <Text style={styles.listItemNetwork}>{item.network}</Text>
        </View>
        <Text style={styles.listItemAddress}>{item.address}</Text>
        <View style={styles.listItemInfo}>
          <Text style={styles.priceText}>⛽ 95: {formatPrice(fuel95)}</Text>
          <Text style={[styles.priceText, styles.dtPrice]}>
            🛢️ ДТ: {formatPrice(fuelDt)}
          </Text>
          <View style={[styles.queueBadge, { backgroundColor: queueColor }]}>
            <Text style={styles.queueBadgeText}>
              {item.queue_length} 🚗 {queueText}
            </Text>
          </View>
        </View>
        {item.tanker_active === 1 && (
          <View style={styles.tankerBadge}>
            <Text style={styles.tankerBadgeText}>🚛 Бензовоз сливается</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.reportButton}
          onPress={() => onReportPress(item)}
        >
          <Text style={styles.reportButtonText}>📝 Сообщить</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={stations}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>🚫 Нет АЗС по фильтрам</Text>
        </View>
      }
    />
  );
};

// ============================================================
// ОСНОВНОЕ ПРИЛОЖЕНИЕ
// ============================================================
const App = () => {
  const [stations, setStations] = useState<GasStation[]>([]);
  const [filteredStations, setFilteredStations] = useState<GasStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStation, setSelectedStation] = useState<GasStation | null>(
    null
  );
  const [filters, setFilters] = useState({
    fuelType: 'АИ-95',
    showAvailableOnly: false,
  });

  const [reportData, setReportData] = useState<ReportData>({
    station_id: 0,
    user_name: '',
    report_type: 'price',
    fuel_type: 'АИ-95',
    price: null,
    queue_length: null,
    availability: null,
    tanker_active: 0,
    description: '',
  });

  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 44.9,
    longitude: 37.9,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });

  // ===== ВАЖНО: ЗАМЕНИ НА СВОЙ IP =====
  const API_URL = 'http://192.168.1.100:3001'; // ЗАМЕНИ НА СВОЙ IP

  // ===== ЗАГРУЗКА ДАННЫХ =====
  const loadStations = async () => {
    try {
      const response = await fetch(`${API_URL}/api/gas-stations`);
      const data = await response.json();
      setStations(data);
      applyFilters(data, filters);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить данные: ' + error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = (data: GasStation[], currentFilters: typeof filters) => {
    let filtered = data;

    if (currentFilters.showAvailableOnly) {
      filtered = filtered.filter((station) => {
        const fuelArray = station.fuel_stock?.[0] || [];
        return fuelArray.some((f) => f.availability === 1);
      });
    }

    setFilteredStations(filtered);
  };

  useEffect(() => {
    loadStations();
  }, []);

  useEffect(() => {
    applyFilters(stations, filters);
  }, [filters, stations]);

  // ===== ЦВЕТ МАРКЕРА =====
  const getMarkerColor = (queue: number) => {
    if (queue <= 3) return '#22c55e';
    if (queue <= 6) return '#f59e0b';
    return '#ef4444';
  };

  // ===== ОТПРАВКА ОТЧЁТА =====
  const sendReport = async () => {
    if (!selectedStation) return;

    const data = {
      station_id: selectedStation.id,
      user_name