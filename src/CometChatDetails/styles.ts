import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1, paddingLeft: 15, backgroundColor: '#fff' },
  sectionDivider: {
    height: 1,
    marginTop: 20,
    marginBottom: 10,
  },
  listItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 15,
    paddingLeft: 5,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  listItemTailIcon: { height: 12, width: 12 },
});
