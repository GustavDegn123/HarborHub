import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity, Alert, ScrollView } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

function DKK(n){ return typeof n==="number"
  ? new Intl.NumberFormat("da-DK",{style:"currency",currency:"DKK",maximumFractionDigits:0}).format(n)
  : "—"; }

export default function JobDetailScreen(){
  const route = useRoute();
  const navigation = useNavigation();
  const user = auth.currentUser;
  const jobId = route?.params?.jobId;

  const [loading,setLoading] = useState(true);
  const [job,setJob] = useState(null);
  const [saving,setSaving] = useState(false);

  async function reload(){
    try{
      const snap = await getDoc(doc(db,"jobs",jobId));
      setJob(snap.exists()? {id:snap.id,...snap.data()} : null);
    }catch(e){
      Alert.alert("Fejl","Kunne ikke hente jobbet.");
    }finally{
      setLoading(false);
    }
  }
  useEffect(() => { reload(); }, [jobId]);

  const created = useMemo(()=>{
    const ts = job?.createdAt;
    if(ts?.toDate) return new Intl.DateTimeFormat("da-DK",{dateStyle:"medium", timeStyle:"short"}).format(ts.toDate());
    return "";
  },[job]);

  const rawStatus = String(job?.status || "").toLowerCase();
  const isOpen       = rawStatus === "open";
  const isClaimed    = rawStatus === "claimed";
  const inProgress   = rawStatus === "in_progress" || rawStatus === "inprogress";
  const isCompleted  = rawStatus === "completed";

  // LEGACY aliaser
  const legacyClaimed   = ["accepted","taken"].includes(rawStatus);
  const legacyCompleted = ["done","finished","complete"].includes(rawStatus);

  const iAmOwner     = user?.uid && job?.createdBy === user.uid;
  const iAmProvider  = user?.uid && (job?.acceptedBy === user.uid || job?.providerId === user.uid /* legacy */);

  async function onClaim(){
    if(!user?.uid) return Alert.alert("Ikke logget ind","Log ind for at tage jobbet.");
    if(!job || !(isOpen || legacyClaimed)) return; // tillad også claim hvis legacyClaimed men uden acceptedBy
    setSaving(true);
    try{
      await updateDoc(doc(db,"jobs",job.id),{
        status:"claimed",
        acceptedBy: job?.acceptedBy || user.uid,
        acceptedAt: job?.acceptedAt || serverTimestamp(),
      });
      await reload();
      Alert.alert("Job taget","Jobbet er tilføjet til dine opgaver.");
    }catch(e){
      Alert.alert("Fejl","Kunne ikke tage jobbet. "+(e?.message||""));
    }finally{
      setSaving(false);
    }
  }

  async function onStart(){
    if(!(iAmProvider && (isClaimed || legacyClaimed || isOpen))) return;
    setSaving(true);
    try{
      await updateDoc(doc(db,"jobs",job.id),{
        status:"in_progress",
        startedAt: serverTimestamp(),
        acceptedBy: job?.acceptedBy || user.uid,
        acceptedAt: job?.acceptedAt || serverTimestamp(),
      });
      await reload();
    }catch(e){
      Alert.alert("Fejl","Kunne ikke starte arbejdet. "+(e?.message||""));
    }finally{
      setSaving(false);
    }
  }

  async function onComplete(){
    if(!(iAmProvider && (isClaimed || inProgress || legacyClaimed))) return;
    setSaving(true);
    try{
      await updateDoc(doc(db,"jobs",job.id),{
        status:"completed",
        completedAt: serverTimestamp(),
        acceptedBy: job?.acceptedBy || user.uid,
        acceptedAt: job?.acceptedAt || serverTimestamp(),
      });
      await reload();
      Alert.alert("Afsluttet","Jobbet er markeret som færdigt.");
    }catch(e){
      Alert.alert("Fejl","Kunne ikke afslutte jobbet. "+(e?.message||""));
    }finally{
      setSaving(false);
    }
  }

  // Hjælpeknap: konverter legacy status/fields til nutid
  async function onNormalizeLegacy(){
    if(!iAmProvider) return;
    setSaving(true);
    try{
      const update = {};
      if(legacyClaimed && !isClaimed) update.status = "claimed";
      if(legacyCompleted && !isCompleted) update.status = "completed";
      if(!job?.acceptedBy && job?.providerId === user.uid) {
        update.acceptedBy = user.uid;
        if(!job?.acceptedAt) update.acceptedAt = serverTimestamp();
      }
      if(Object.keys(update).length === 0){
        Alert.alert("Intet at opdatere","Jobbet er allerede i nyt format.");
      } else {
        await updateDoc(doc(db,"jobs",job.id), update);
        await reload();
        Alert.alert("Opdateret","Jobstatus er normaliseret.");
      }
    }catch(e){
      Alert.alert("Fejl","Kunne ikke opdatere legacy job. "+(e?.message||""));
    }finally{
      setSaving(false);
    }
  }

  if(loading){
    return(
      <View style={{flex:1,alignItems:"center",justifyContent:"center"}}>
        <ActivityIndicator/>
        <Text style={{marginTop:8,color:"#6b7280"}}>Henter job…</Text>
      </View>
    );
  }
  if(!job){
    return(
      <View style={{flex:1,alignItems:"center",justifyContent:"center",padding:24}}>
        <Text style={{fontWeight:"800",fontSize:16,marginBottom:6}}>Job ikke fundet</Text>
        <Text style={{color:"#6b7280",textAlign:"center"}}>Prøv at gå tilbage til oversigten.</Text>
      </View>
    );
  }

  const statusBadge = (() => {
    const base = { textTransform:"capitalize", fontWeight:"800", paddingHorizontal:10, paddingVertical:4, borderRadius:999 };
    const s = rawStatus || "ukendt";
    if(isCompleted || legacyCompleted) return <Text style={{...base, backgroundColor:"#e7f7ee", color:"#1c8b4a"}}>{s}</Text>;
    if(inProgress) return <Text style={{...base, backgroundColor:"#fff7ed", color:"#b45309"}}>{s}</Text>;
    if(isClaimed || legacyClaimed)  return <Text style={{...base, backgroundColor:"#eef5fb", color:"#1f5c7d"}}>{s}</Text>;
    return <Text style={{...base, backgroundColor:"#e5e7eb", color:"#374151"}}>{s}</Text>;
  })();

  const showNormalize = iAmProvider && (legacyClaimed || legacyCompleted || (!job?.acceptedBy && job?.providerId === user.uid));

  return(
    <ScrollView style={{flex:1, backgroundColor:"#f6f9fc"}} contentContainerStyle={{padding:16}}>
      <View style={{backgroundColor:"#fff", borderRadius:16, borderWidth:1, borderColor:"#e6eef4", padding:16}}>
        <View style={{flexDirection:"row", justifyContent:"space-between", alignItems:"center"}}>
          <Text style={{fontSize:20,fontWeight:"900",color:"#0f1f2a"}}>{job.title || "Job uden titel"}</Text>
          {statusBadge}
        </View>

        {created ? <Text style={{marginTop:4,color:"#6b7280"}}>Oprettet: {created}</Text> : null}

        {typeof job.price==="number" ? (
          <View style={{marginTop:12, padding:12, borderRadius:12, backgroundColor:"#f2f8fc", borderWidth:1, borderColor:"#cfe1ec"}}>
            <Text style={{color:"#1f5c7d", fontWeight:"800"}}>Prisestimat</Text>
            <Text style={{marginTop:4, fontSize:18, fontWeight:"900"}}>{DKK(job.price)}</Text>
          </View>
        ) : null}

        {job.description ? (
          <View style={{marginTop:12}}>
            <Text style={{fontWeight:"800", color:"#0f1f2a"}}>Beskrivelse</Text>
            <Text style={{marginTop:6,color:"#374151"}}>{job.description}</Text>
          </View>
        ) : null}

        {Array.isArray(job.requiredServices) && job.requiredServices.length>0 ? (
          <View style={{marginTop:12}}>
            <Text style={{fontWeight:"800", color:"#0f1f2a"}}>Efterspurgte ydelser</Text>
            <View style={{flexDirection:"row", flexWrap:"wrap", gap:8, marginTop:8}}>
              {job.requiredServices.map(s=>(
                <View key={s} style={{paddingHorizontal:10,paddingVertical:6,borderRadius:999, backgroundColor:"#eef5fb", borderWidth:1, borderColor:"#cfe1ec"}}>
                  <Text style={{color:"#1f5c7d", fontWeight:"700"}}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {job.boat?.name ? (
          <View style={{marginTop:12}}>
            <Text style={{fontWeight:"800", color:"#0f1f2a"}}>Båd</Text>
            <Text style={{marginTop:6,color:"#374151"}}>
              {job.boat.name}{job.boat.type ? ` · ${job.boat.type}` : ""}{job.boat.length ? ` · ${job.boat.length} ft` : ""}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={{height:12}} />

      {/* ACTIONS */}
      {isOpen && (
        <TouchableOpacity
          disabled={saving}
          onPress={onClaim}
          style={{ backgroundColor:"#1f5c7d", paddingVertical:16, alignItems:"center", borderRadius:14, marginBottom:10 }}
        >
          <Text style={{color:"#fff", fontWeight:"900", fontSize:16}}>
            {saving ? "Udfører…" : "Tag jobbet"}
          </Text>
        </TouchableOpacity>
      )}

      {iAmProvider && !isCompleted && (
        <View style={{ gap:10 }}>
          {(isClaimed || legacyClaimed || isOpen) && (
            <TouchableOpacity
              disabled={saving}
              onPress={onStart}
              style={{ backgroundColor:"#fb923c", paddingVertical:16, alignItems:"center", borderRadius:14 }}
            >
              <Text style={{color:"#fff", fontWeight:"900", fontSize:16}}>
                {saving ? "Starter…" : "Start arbejde"}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            disabled={saving}
            onPress={onComplete}
            style={{ backgroundColor:"#16a34a", paddingVertical:16, alignItems:"center", borderRadius:14 }}
          >
            <Text style={{color:"#fff", fontWeight:"900", fontSize:16}}>
              {saving ? "Afslutter…" : "Afslut job"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {showNormalize && (
        <>
          <View style={{height:10}}/>
          <TouchableOpacity
            disabled={saving}
            onPress={onNormalizeLegacy}
            style={{ backgroundColor:"#eef2ff", borderColor:"#c7d2fe", borderWidth:1, paddingVertical:12, alignItems:"center", borderRadius:14 }}
          >
            <Text style={{color:"#3730a3", fontWeight:"900"}}>{saving ? "Opdaterer…" : "Opdater status (legacy)"}</Text>
          </TouchableOpacity>
        </>
      )}

      {isCompleted && (
        <View style={{ padding:14, borderRadius:12, backgroundColor:"#e7f7ee", borderWidth:1, borderColor:"#b7ebc5", alignItems:"center", marginTop:4 }}>
          <Text style={{ color:"#1c8b4a", fontWeight:"900" }}>Jobbet er afsluttet</Text>
        </View>
      )}
    </ScrollView>
  );
}
