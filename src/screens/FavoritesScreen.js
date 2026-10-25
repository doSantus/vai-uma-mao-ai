import React, { useCallback, useRef } from 'react';
import { FlatList, Text, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../components/Screen';
import ProviderCard from '../components/ProviderCard';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import { useData } from '../context/DataContext';
import { errorMessage } from '../services/errors';
import { colors, spacing, typography } from '../theme';
export default function FavoritesScreen({ navigation }) {
  const data=useData();
  const api=useRef(data);api.current=data;
  const refresh=()=>api.current.refreshData().catch(e=>Alert.alert('Não foi possível atualizar',errorMessage(e)));
  useFocusEffect(useCallback(()=>{refresh();},[]));
  return <Screen><FlatList refreshing={data.refreshing} onRefresh={refresh}
    ListHeaderComponent={<><Text accessibilityRole="header" style={styles.title}>Favoritos ({data.favorites.length})</Text>
      {!!data.loadError&&<><Text accessibilityRole="alert">{data.loadError}</Text><Button title="Tentar novamente" onPress={refresh}/></>}</>}
    data={data.favorites} keyExtractor={item=>item.id}
    renderItem={({item})=><ProviderCard provider={item} onPress={()=>navigation.navigate('ProviderDetails',{providerId:item.id})}/>}
    ListEmptyComponent={<EmptyState title="Nenhum favorito ainda" subtitle="Toque no coração de um profissional na busca para salvá-lo aqui."/>}/>
  </Screen>;
}
const styles=StyleSheet.create({title:{...typography.h2,color:colors.text,marginVertical:spacing.md}});
