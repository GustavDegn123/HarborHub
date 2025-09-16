import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function HomeScreen({ navigation }) {
  const handleLogout = async () => { try { await signOut(auth); } catch (e) { console.warn(e?.message || e); } };
  const goOnboarding = () => navigation.navigate("StartTakingJobs");

  return (
    <View style={{ flex: 1, backgroundColor: "#ECF6FF" }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.topbar}>
          <View style={styles.brandLeft}>
            <View style={styles.logoDot} />
            <Text style={styles.brand}>HarborHub</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate("JobsFeed")} style={styles.topIconBtn}>
            <Feather name="briefcase" size={20} color="#0f1f2a" />
          </TouchableOpacity>
        </View>

        <View style={styles.heroWrap}>
          <View style={styles.heroCard}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <Feather name="anchor" size={22} color="#0f1f2a" />
              <Text style={styles.heroEyebrow}>Velkommen til</Text>
            </View>
            <Text style={styles.heroTitle}>HarborHub</Text>
            <Text style={styles.heroSubtitle}>Få overblik, tag opgaver og tjen på din ekspertise ⚓</Text>

            <TouchableOpacity activeOpacity={0.9} onPress={goOnboarding} style={styles.ctaPrimaryGrad}>
              <Feather name="compass" size={18} color="#fff" />
              <Text style={styles.ctaPrimaryText}>Bliv udbyder (onboarding)</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.9} onPress={handleLogout} style={styles.ctaGhost}>
              <Feather name="log-out" size={18} color="#e54848" />
              <Text style={styles.ctaGhostText}>Log ud</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.features}>
          <View style={styles.chip}><Feather name="map-pin" size={16} color="#1f5c7d" /><Text style={styles.chipText}>Vælg placering</Text></View>
          <View style={styles.chip}><Feather name="settings" size={16} color="#1f5c7d" /><Text style={styles.chipText}>Vælg ydelser</Text></View>
          <View style={styles.chip}><Feather name="check-circle" size={16} color="#1f5c7d" /><Text style={styles.chipText}>Tag job</Text></View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  topbar:{paddingHorizontal:20,paddingTop:4,paddingBottom:6,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
  brandLeft:{flexDirection:"row",alignItems:"center"},
  brand:{fontSize:20,fontWeight:"800",color:"#0f1f2a",letterSpacing:0.3,marginLeft:8},
  logoDot:{width:10,height:10,borderRadius:6,backgroundColor:"#1f5c7d"},
  topIconBtn:{height:36,width:36,borderRadius:10,backgroundColor:"#ffffff",alignItems:"center",justifyContent:"center",
    shadowColor:"#000",shadowOpacity:0.08,shadowRadius:6,shadowOffset:{width:0,height:3},elevation:2},
  heroWrap:{paddingHorizontal:20,marginTop:24},
  heroCard:{backgroundColor:"#ffffff",borderRadius:20,padding:18,shadowColor:"#000",shadowOpacity:0.10,shadowRadius:16,
    shadowOffset:{width:0,height:8},elevation:4},
  heroEyebrow:{marginLeft:8,color:"#334155",fontWeight:"700",letterSpacing:0.4},
  heroTitle:{fontSize:32,lineHeight:36,fontWeight:"900",color:"#0f1f2a",marginBottom:8},
  heroSubtitle:{color:"#475569",marginBottom:16,lineHeight:20},
  ctaPrimaryGrad:{flexDirection:"row",alignItems:"center",justifyContent:"center",paddingVertical:14,gap:8,borderRadius:14,
    backgroundColor:"#1f5c7d",marginBottom:10},
  ctaPrimaryText:{color:"#fff",fontWeight:"800",fontSize:16},
  ctaGhost:{flexDirection:"row",alignItems:"center",justifyContent:"center",borderRadius:12,paddingVertical:12,borderWidth:1,
    borderColor:"#ffd1d1",backgroundColor:"#fff5f5",gap:8},
  ctaGhostText:{color:"#e54848",fontWeight:"800",fontSize:15},
  features:{flexDirection:"row",justifyContent:"center",gap:10,paddingHorizontal:20,marginTop:18},
  chip:{flexDirection:"row",alignItems:"center",gap:6,backgroundColor:"#ffffff",borderRadius:999,paddingVertical:8,paddingHorizontal:12,
    borderWidth:1,borderColor:"#e6eef4",shadowColor:"#000",shadowOpacity:0.05,shadowRadius:8,shadowOffset:{width:0,height:4},elevation:2},
  chipText:{color:"#0f1f2a",fontWeight:"600"},
});
