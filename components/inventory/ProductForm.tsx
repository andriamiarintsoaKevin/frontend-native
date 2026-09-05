import { Picker } from "@react-native-picker/picker";
import { useIsFocused } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { Category, Product, SectorType } from "../../types";
import ErrorNotice from "../errorNotice";
import { useTheme } from "../themeProvider";

interface ProductFormProps {
  initialData?: Partial<Product>;
  categories: Category[];
  onSubmit: (data: Omit<Product, "id" | "category">) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export default function ProductForm({
  initialData,
  categories,
  onSubmit,
  onCancel,
  isLoading,
}: ProductFormProps) {
  const { colors } = useTheme();
  const isFocused = useIsFocused();

  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [price, setPrice] = useState(
    initialData?.price !== undefined ? initialData.price.toString() : "",
  );
  const [quantity, setQuantity] = useState(
    initialData?.quantity !== undefined ? initialData.quantity.toString() : "0",
  );
  const [categoryId, setCategoryId] = useState<number | undefined>(
    initialData?.category_id,
  );
  const [sku, setSku] = useState(initialData?.sku || "");
  const [sector, setSector] = useState(initialData?.sector || "general");
  const [reorderThreshold, setReorderThreshold] = useState(
    initialData?.reorder_threshold?.toString() || "10",
  );
  const [warehouseLocation, setWarehouseLocation] = useState(
    initialData?.warehouse_location || "",
  );
  const [batchNumber, setBatchNumber] = useState(
    initialData?.batch_number || "",
  );
  const [expiryDate, setExpiryDate] = useState(
    initialData?.expiry_date?.slice(0, 10) || "",
  );
  const [storageTemperature, setStorageTemperature] = useState(
    initialData?.storage_temperature?.toString() || "",
  );
  const [serialNumber, setSerialNumber] = useState(
    initialData?.serial_number || "",
  );
  const [hardwareCondition, setHardwareCondition] = useState(
    initialData?.hardware_condition || "",
  );
  const [assignedTo, setAssignedTo] = useState(initialData?.assigned_to || "");
  const [error, setError] = useState("");

  const handleSectorChange = (nextSector: SectorType) => {
    setSector(nextSector);

    if (nextSector !== "medical") {
      setBatchNumber("");
      setExpiryDate("");
      setStorageTemperature("");
    }

    if (nextSector !== "it") {
      setSerialNumber("");
      setHardwareCondition("");
      setAssignedTo("");
    }
  };

  useEffect(() => {
    if (isFocused) return;
    setName("");
    setDescription("");
    setPrice("");
    setQuantity("0");
    setCategoryId(undefined);
    setSku("");
    setSector("general");
    setReorderThreshold("10");
    setWarehouseLocation("");
    setBatchNumber("");
    setExpiryDate("");
    setStorageTemperature("");
    setSerialNumber("");
    setHardwareCondition("");
    setAssignedTo("");
    setError("");
  }, [isFocused]);

  const handleSubmit = async () => {
    setError("");

    if (!name.trim() || price === "" || quantity === "" || !categoryId) {
      setError("Veuillez remplir tous les champs obligatoires (*).");
      return;
    }

    const parsedPrice = parseFloat(price.replace(",", "."));
    const parsedQuantity = parseInt(quantity, 10);
    const parsedThreshold = parseInt(reorderThreshold, 10);
    const parsedTemperature = storageTemperature
      ? parseFloat(storageTemperature.replace(",", "."))
      : undefined;

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError("Le prix unitaire doit être positif ou nul.");
      return;
    }

    if (isNaN(parsedQuantity) || parsedQuantity < 0) {
      setError("La quantité en stock ne peut pas être négative.");
      return;
    }

    if (isNaN(parsedThreshold) || parsedThreshold < 0) {
      setError("Le seuil de réapprovisionnement est invalide.");
      return;
    }

    if (parsedTemperature !== undefined && isNaN(parsedTemperature)) {
      setError("La température de stockage est invalide.");
      return;
    }

    if (expiryDate && !/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
      setError("La date doit respecter le format AAAA-MM-JJ.");
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
        price: parsedPrice,
        quantity: parsedQuantity,
        category_id: categoryId,
        sku: sku.trim() || null,
        sector,
        reorder_threshold: parsedThreshold,
        warehouse_location: warehouseLocation.trim() || null,
        batch_number: sector === "medical" ? batchNumber.trim() || null : null,
        expiry_date:
          sector === "medical" && expiryDate ? `${expiryDate}T00:00:00Z` : null,
        storage_temperature:
          sector === "medical" ? (parsedTemperature ?? null) : null,
        serial_number: sector === "it" ? serialNumber.trim() || null : null,
        hardware_condition:
          sector === "it" ? hardwareCondition.trim() || null : null,
        assigned_to: sector === "it" ? assignedTo.trim() || null : null,
      });
    } catch (e: any) {
      setError(e.message || "Une erreur est survenue");
    }
  };

  return (
    <ScrollView style={styles.container}>
      {error ? <ErrorNotice message={error} /> : null}

      <Text style={[styles.label, { color: colors.text }]}>
        Nom du produit *
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
            color: colors.text,
          },
        ]}
        value={name}
        onChangeText={setName}
        placeholder="Nom"
        placeholderTextColor={colors.textMuted}
      />

      <Text style={[styles.label, { color: colors.text }]}>Catégorie *</Text>
      <View
        style={[
          styles.pickerContainer,
          { backgroundColor: colors.inputBg, borderColor: colors.inputBorder },
        ]}
      >
        <Picker
          selectedValue={categoryId}
          onValueChange={(value) => setCategoryId(value)}
          style={{ color: colors.text }}
          dropdownIconColor={colors.textMuted}
        >
          <Picker.Item label="Sélectionner une catégorie" value={undefined} />
          {categories.map((category) => (
            <Picker.Item
              key={category.id}
              label={category.name}
              value={category.id}
            />
          ))}
        </Picker>
      </View>

      <Text style={[styles.label, { color: colors.text }]}>Secteur *</Text>
      <View
        style={[
          styles.pickerContainer,
          { backgroundColor: colors.inputBg, borderColor: colors.inputBorder },
        ]}
      >
        <Picker
          selectedValue={sector}
          onValueChange={(value) => handleSectorChange(value as SectorType)}
          style={{ color: colors.text }}
          dropdownIconColor={colors.textMuted}
        >
          <Picker.Item label="Général / Logistique" value="general" />
          <Picker.Item label="Médical / Pharma" value="medical" />
          <Picker.Item label="Matériel IT" value="it" />
        </Picker>
      </View>

      <Text style={[styles.label, { color: colors.text }]}>
        SKU / code scanner
      </Text>
      <TextInput {...inputProps(colors, sku, setSku, "PARA-500-001")} />

      <Text style={[styles.label, { color: colors.text }]}>Emplacement</Text>
      <TextInput
        {...inputProps(
          colors,
          warehouseLocation,
          setWarehouseLocation,
          "A-01-03",
        )}
      />

      <Text style={[styles.label, { color: colors.text }]}>Prix (€) *</Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
            color: colors.text,
          },
        ]}
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
        placeholder="0.00"
        placeholderTextColor={colors.textMuted}
      />

      <Text style={[styles.label, { color: colors.text }]}>Quantité *</Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
            color: colors.text,
          },
        ]}
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor={colors.textMuted}
      />

      <Text style={[styles.label, { color: colors.text }]}>
        Seuil de réapprovisionnement
      </Text>
      <TextInput
        {...inputProps(colors, reorderThreshold, setReorderThreshold, "10")}
        keyboardType="number-pad"
      />

      {sector === "medical" && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Données médicales
          </Text>
          <Text style={[styles.label, { color: colors.text }]}>
            Numéro de lot
          </Text>
          <TextInput
            {...inputProps(colors, batchNumber, setBatchNumber, "LOT-2026-09")}
          />
          <Text style={[styles.label, { color: colors.text }]}>
            Date d'expiration (AAAA-MM-JJ)
          </Text>
          <TextInput
            {...inputProps(colors, expiryDate, setExpiryDate, "2027-09-04")}
          />
          <Text style={[styles.label, { color: colors.text }]}>
            Température de stockage (°C)
          </Text>
          <TextInput
            {...inputProps(
              colors,
              storageTemperature,
              setStorageTemperature,
              "4",
            )}
            keyboardType="decimal-pad"
          />
        </>
      )}

      {sector === "it" && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Données matériel IT
          </Text>
          <Text style={[styles.label, { color: colors.text }]}>
            Numéro de série
          </Text>
          <TextInput
            {...inputProps(colors, serialNumber, setSerialNumber, "SN-001")}
          />
          <Text style={[styles.label, { color: colors.text }]}>
            État du matériel
          </Text>
          <TextInput
            {...inputProps(
              colors,
              hardwareCondition,
              setHardwareCondition,
              "Neuf",
            )}
          />
          <Text style={[styles.label, { color: colors.text }]}>Attribué à</Text>
          <TextInput
            {...inputProps(
              colors,
              assignedTo,
              setAssignedTo,
              "Service informatique",
            )}
          />
        </>
      )}

      <Text style={[styles.label, { color: colors.text }]}>Description</Text>
      <TextInput
        style={[
          styles.input,
          styles.textArea,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
            color: colors.text,
          },
        ]}
        value={description}
        onChangeText={setDescription}
        placeholder="Description détaillée..."
        placeholderTextColor={colors.textMuted}
        multiline
        numberOfLines={4}
      />

      <View style={styles.buttonContainer}>
        <Pressable
          style={[
            styles.button,
            styles.cancelButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={onCancel}
          disabled={isLoading}
        >
          <Text style={[styles.buttonText, { color: colors.text }]}>
            Annuler
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.button,
            styles.submitButton,
            { backgroundColor: colors.primary },
          ]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
              Enregistrer
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: 22,
    marginBottom: 2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
  },
  categoryScroll: {
    paddingHorizontal: 12,
  },
  categoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 24,
    marginBottom: 40,
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    borderWidth: 1,
  },
  submitButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

function inputProps(
  colors: ReturnType<typeof useTheme>["colors"],
  value: string,
  onChangeText: (value: string) => void,
  placeholder: string,
) {
  return {
    value,
    onChangeText,
    placeholder,
    placeholderTextColor: colors.textMuted,
    style: {
      backgroundColor: colors.inputBg,
      borderColor: colors.inputBorder,
      color: colors.text,
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
    },
  };
}
