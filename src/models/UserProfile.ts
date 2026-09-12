import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class UserProfile extends Model {
  public userId!: string;
  public avgLoginTime!: number;
  public commonLocations!: string[];
  public typicalResources!: string[];
  public normalHoursOfAccess!: [number, number];
  public lastUpdated!: Date;
  public baselineEvents!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UserProfile.init(
  {
    userId: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    avgLoginTime: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    commonLocations: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    typicalResources: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    normalHoursOfAccess: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      defaultValue: [9, 17],
    },
    lastUpdated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    baselineEvents: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: 'UserProfile',
    tableName: 'user_profiles',
    timestamps: true,
    underscored: true,
  }
);

export default UserProfile;
