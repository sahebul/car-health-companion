import React, { useState, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    Modal,
    FlatList,
    TouchableOpacity,
    Platform,
    useColorScheme,
    TouchableWithoutFeedback
} from "react-native";
import { Ionicons, MaterialIcons, SimpleLineIcons } from "@expo/vector-icons";

interface Option {
    label: string;
    value: string;
}
interface OptionObject {
    label: string;
    value: string;
}

interface DropdownProps {
    options: Option[];
    onSelect: (value: object) => void;
    selectedValue: OptionObject;
    placeholder: string;
    // key:string;
    // value:string;
}

const DropDown: React.FC<DropdownProps> = ({
    options,
    onSelect,
    selectedValue,
    placeholder

}) => {
    const [visible, setVisible] = useState(false);
    const [dropdownTop, setDropdownTop] = useState(0);
    const [dropdownLeft, setDropdownLeft] = useState(0);
    const [dropdownWidth, setDropdownWidth] = useState(0);
    const dropdownButtonRef = useRef<TouchableOpacity>(null);
    const isDark = useColorScheme() === 'dark';

    const toggleDropdown = () => {
        visible ? setVisible(false) : openDropdown();
    };

    const openDropdown = () => {
        dropdownButtonRef.current?.measure((_fx, _fy, w, h, px, py) => {
            setDropdownTop(py + h + 5); // Add a small gap of 5
            setDropdownLeft(px);
            setDropdownWidth(w);
            setVisible(true);
        });
    };

    return (
        <View style={[styles.input, { borderColor: isDark ? '#545151ff' : '#cdcdcdff', backgroundColor: isDark ? '#000' : '#fff' }]}>
            <TouchableOpacity ref={dropdownButtonRef} onPress={toggleDropdown}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: isDark ? '#fff' : '#000' }}>
                        {selectedValue.label || "Select an option"}
                    </Text>
                    <View style={{ paddingLeft: 5, flexDirection: 'column' }}>
                        <SimpleLineIcons name="arrow-up" style={{ margin: 0, padding: 0 }} color={isDark ? "#ddd" : "#555"} size={8} />
                        <SimpleLineIcons name="arrow-down" style={{ margin: 0, padding: 0, marginTop: -2 }} color={isDark ? "#ddd" : "#555"} size={8} />
                    </View>
                </View>
            </TouchableOpacity>

            <Modal visible={visible} transparent animationType="fade">
                <TouchableWithoutFeedback onPress={() => setVisible(false)}>
                    <View style={styles.overlay}>
                        <View style={{ position: 'absolute', top: dropdownTop, left: dropdownLeft, width: dropdownWidth }}>
                            <FlatList
                                style={[styles.listContainer, { width: '100%' }]}
                                data={options}
                                keyExtractor={(item) => item.value}
                                renderItem={({ index, item }) => (
                                    <TouchableOpacity
                                        onPress={() => {
                                            onSelect(item);
                                            setVisible(false);
                                        }}
                                    >
                                        <View>
                                            {JSON.stringify(selectedValue) === JSON.stringify(item) ? (
                                                <View
                                                    style={{ flexDirection: "row", alignItems: "center" }}
                                                >
                                                    <Ionicons name="checkmark" size={14} color={"#fff"} />
                                                    <Text style={{ color: "#fff", padding: 10 }}>{item.label}</Text>
                                                </View>
                                            ) : (
                                                <Text
                                                    style={{ color: "#fff", padding: 10, marginLeft: 15 }}
                                                >
                                                    {item.label}
                                                </Text>
                                            )}

                                            {index != options.length - 1 && (
                                                <View
                                                    style={{ backgroundColor: "#ddd", height: 0.5 }}
                                                ></View>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
};

export default DropDown;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0)', // Ensure transparent overlay for full-screen touch support
    },
    listContainer: {
        backgroundColor: "#3e454f",
        borderRadius: 15,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 10, height: 11 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    input: {
        paddingHorizontal: 16,
        paddingVertical: Platform.OS === 'ios' ? 14 : 10,
        borderRadius: 10,
        fontSize: 16,
        borderWidth: 1,
    }
})
