import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Screen from '../components/Screen';
import FilterBar from '../components/FilterBar';
import ProviderCard from '../components/ProviderCard';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import { useData } from '../context/DataContext';
import { errorMessage } from '../services/errors';
import { colors, spacing, typography } from '../theme';
import useDeviceLocation from '../hooks/useDeviceLocation';

const emptyFilters={search:'',city:'',state:'',selectedCategory:''};
export default function SearchScreen({ navigation }) {
  const data=useData();
  const api=useRef(data); api.current=data;
  const focused=useIsFocused();
  const [filters,setFilters]=useState(emptyFilters);
  const [ready,setReady]=useState(false);
  const [rows,setRows]=useState([]);
  const [busy,setBusy]=useState(false);
  const [more,setMore]=useState(false);
  const [error,setError]=useState('');
  const [storageError,setStorageError]=useState('');
  const version=useRef(0);
  const busyRef=useRef(false);
  const setField=(key)=>(value)=>setFilters(old=>({...old,[key]:value||''}));
  const {locating,locationMessage,useCurrentLocation}=useDeviceLocation(setField('city'),setField('state'));
  useEffect(()=>{
    let active=true;
    data.preferences.read(data.session.id).then(saved=>{if(active)setFilters({...emptyFilters,...saved});})
      .catch(()=>{if(active)setStorageError('Não foi possível recuperar os filtros salvos.');})
      .finally(()=>{if(active)setReady(true);});
    return()=>{active=false;};
  },[data.session.id]);
  useEffect(()=>{
    if(!ready)return;
    const timer=setTimeout(()=>api.current.preferences.write(api.current.session.id,filters)
      .then(()=>setStorageError('')).catch(()=>setStorageError('Os filtros não puderam ser salvos neste aparelho.')),500);
    return()=>clearTimeout(timer);
  },[filters,ready]);
  async function load(append=false) {
    if(append && busyRef.current)return;
    const current=++version.current;
    busyRef.current=true;setBusy(true);setError('');
    const offset=append?rows.length:0;
    try {
      const result=await api.current.searchProviders(filters,offset);
      if(version.current!==current)return;
      setRows(old=>append?[...old,...result.filter(p=>!old.some(previous=>previous.id===p.id))]:result);
      setMore(result.length===20);
    } catch(e){if(version.current===current)setError(errorMessage(e));}
    finally{if(version.current===current){setBusy(false);busyRef.current=false;}}
  }
  useEffect(()=>{
    if(!ready||!focused)return;
    version.current++;setRows([]);setMore(false);setBusy(true);
    const timer=setTimeout(()=>load(),350);
    return()=>{clearTimeout(timer);version.current++;busyRef.current=false;};
  },[filters,ready,focused,data.revision]);
  async function refresh() {
    await load();
    api.current.refreshData().catch(e=>setError(errorMessage(e)));
  }
  async function clearFilters(){
    setFilters(emptyFilters);
    try{await api.current.preferences.clear(api.current.session.id);setStorageError('');}
    catch{setStorageError('Não foi possível limpar os filtros salvos.');}
  }
  return <Screen><FlatList
    keyboardShouldPersistTaps="handled" data={rows} keyExtractor={item=>item.id}
    refreshing={busy} onRefresh={refresh}
    ListHeaderComponent={<>
      <View style={styles.header}><Text style={styles.title}>Buscar prestadores</Text><Text style={styles.note}>{rows.length} profissional(is) carregado(s)</Text></View>
      <FilterBar search={filters.search} onSearchChange={setField('search')} categories={data.categories}
        selectedCategory={filters.selectedCategory||null} onSelectCategory={setField('selectedCategory')}
        city={filters.city} onCityChange={setField('city')} state={filters.state} onStateChange={setField('state')}
        onUseLocation={useCurrentLocation} locating={locating} locationMessage={locationMessage}/>
      <Button title="Limpar filtros" variant="ghost" onPress={clearFilters}/>
      {!!storageError&&<Text accessibilityRole="alert" style={styles.note}>{storageError}</Text>}
      {!!(error||data.loadError)&&<><Text accessibilityRole="alert" style={styles.error}>{error||data.loadError}</Text><Button title="Tentar novamente" variant="outline" disabled={busy} onPress={refresh}/></>}
    </>}
    renderItem={({item})=><ProviderCard provider={item} onPress={()=>navigation.navigate('ProviderDetails',{providerId:item.id})}/>}
    ListEmptyComponent={busy?<ActivityIndicator color={colors.primary}/>:!error?<EmptyState title="Nenhum prestador encontrado" subtitle="Ajuste os filtros ou publique o primeiro perfil de prestador."/>:null}
    ListFooterComponent={more?<Button title="Carregar mais" loading={busy} variant="outline" onPress={()=>load(true)}/>:null}
    contentContainerStyle={{paddingBottom:spacing.xl}}/>
  </Screen>;
}
const styles=StyleSheet.create({header:{marginVertical:spacing.md},title:{...typography.h2,color:colors.text},note:{...typography.small,color:colors.textSecondary,marginVertical:spacing.sm},error:{...typography.body,color:colors.error,marginVertical:spacing.sm}});
